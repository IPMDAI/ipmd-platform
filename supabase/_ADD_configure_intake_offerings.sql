-- ============================================================================
-- RPC transactionnelle : configure_intake_offerings
-- Résolveur UNIQUE partagé par le preview (p_apply=false) et l'écriture (p_apply=true).
-- REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT.
--
-- p_apply=false  → PREVIEW : 100% lecture seule. Aucun INSERT/UPDATE, aucun
--                  updated_at, aucune mutation. Renvoie le plan + compteurs.
-- p_apply=true   → APPLY   : dans LA transaction de la fonction (atomique) :
--                  crée uniquement les classes manquantes, upsert (open) les
--                  offres SÉLECTIONNÉES. Additive : ne ferme JAMAIS une offre
--                  hors sélection. Rollback intégral au moindre RAISE.
--
-- Sécurité : SECURITY DEFINER + search_path='' + garde de rôle + EXECUTE restreint.
-- ============================================================================

create or replace function public.configure_intake_offerings(
  p_intake_id uuid,
  p_selection jsonb,
  p_apply     boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year        text;
  v_intake_label text;
  v_start_date  date;
  v_global_reg  int;
  r             record;
  v_rows        jsonb := '[]'::jsonb;
  v_selected    int := 0;
  v_to_create   int := 0;
  v_ready       int := 0;
  v_blocking    int := 0;
  v_ncls        int;
  v_fname       text;
  v_status      text;
  v_reg         int;
  v_scol        int;
  v_cid         uuid;
  v_action      text;
begin
  -- Garde de rôle (nécessite le JWT de l'admin ; le service_role ne passe pas).
  if public.current_user_role()::text not in ('admin','super_admin') then
    raise exception 'Accès refusé';
  end if;

  -- Revalide la rentrée. start_date de la classe = start_date de la rentrée (sinon NULL).
  select academic_year, label, start_date into v_year, v_intake_label, v_start_date
    from public.intakes where id = p_intake_id;
  if v_year is null then raise exception 'Rentrée inconnue.'; end if;

  select coalesce(registration_fee, 300000)::int into v_global_reg
    from public.finance_settings where id = 1;

  -- -------- PASSE 1 : PLAN (lecture seule, mêmes règles pour preview et apply) --------
  for r in
    select (e->>'filiere_id')::uuid as filiere_id, (e->>'level') as level
    from jsonb_array_elements(coalesce(p_selection, '[]'::jsonb)) e
  loop
    v_selected := v_selected + 1;
    v_cid := null; v_reg := null; v_scol := null;

    select name into v_fname from public.filieres where id = r.filiere_id;

    if v_fname is null
       or r.level not in ('Licence 1','Licence 2','Licence 3','Master 1','Master 2') then
      v_status := 'INCOHERENT_BLOQUANT';
    else
      select count(*) into v_ncls from public.classes
        where filiere_id = r.filiere_id and level = r.level
          and academic_year = v_year and intake_id = p_intake_id and kind = 'diplome';
      if    v_ncls > 1 then v_status := 'DOUBLON_BLOQUANT';
      elsif v_ncls = 1 then v_status := 'CLASSE_PRETE';
      else                  v_status := 'A_CREER';
      end if;

      -- Frais dérivés : classe si tarif spécifique, sinon niveau ; inscription classe sinon global.
      if v_ncls = 1 then
        select id,
               coalesce(registration_fee, v_global_reg)::int,
               coalesce(tuition_amount, (select amount from public.tuition_levels where level = r.level))::int
          into v_cid, v_reg, v_scol
          from public.classes
          where filiere_id = r.filiere_id and level = r.level
            and academic_year = v_year and intake_id = p_intake_id and kind = 'diplome'
          limit 1;
      else
        v_reg := v_global_reg;
        select amount::int into v_scol from public.tuition_levels where level = r.level;
      end if;
    end if;

    if    v_status in ('DOUBLON_BLOQUANT','INCOHERENT_BLOQUANT') then v_blocking := v_blocking + 1;
    elsif v_status = 'A_CREER'     then v_to_create := v_to_create + 1;
    elsif v_status = 'CLASSE_PRETE' then v_ready := v_ready + 1;
    end if;

    v_rows := v_rows || jsonb_build_object(
      'filiere_id', r.filiere_id, 'filiere_name', coalesce(v_fname, '(filière inconnue)'),
      'level', r.level, 'status', v_status, 'class_id', v_cid,
      'registration_fee', v_reg, 'tuition_due', v_scol, 'action', 'none'
    );
  end loop;

  -- -------- PREVIEW : aucun effet de bord --------
  if not p_apply then
    return jsonb_build_object(
      'ok', v_blocking = 0,
      'summary', jsonb_build_object('selected', v_selected, 'to_create', v_to_create,
                                    'ready', v_ready, 'blocking', v_blocking),
      'rows', v_rows
    );
  end if;

  -- -------- APPLY : gardes puis écritures atomiques --------
  if v_blocking > 0 then raise exception 'Configuration bloquante : % erreur(s).', v_blocking; end if;
  if v_selected  = 0 then raise exception 'Sélection vide.'; end if;

  v_rows := '[]'::jsonb;
  for r in
    select (e->>'filiere_id')::uuid as filiere_id, (e->>'level') as level
    from jsonb_array_elements(p_selection) e
  loop
    select name into v_fname from public.filieres where id = r.filiere_id;
    select id into v_cid from public.classes
      where filiere_id = r.filiere_id and level = r.level
        and academic_year = v_year and intake_id = p_intake_id and kind = 'diplome'
      limit 1;

    if v_cid is null then
      -- Règles de création (validées) : class_type='initial' (B), start_date héritée de la
      -- rentrée (A), installments=1 par défaut DB, mode/tuition/registration/end_date = NULL.
      insert into public.classes (name, kind, class_type, level, filiere_id, academic_year, intake_id, start_date)
      values (r.level || ' ' || v_fname || ' — ' || v_intake_label,
              'diplome', 'initial', r.level, r.filiere_id, v_year, p_intake_id, v_start_date)
      returning id into v_cid;
      v_status := 'A_CREER'; v_action := 'created';
      v_reg := v_global_reg;
      select amount::int into v_scol from public.tuition_levels where level = r.level;
    else
      v_status := 'CLASSE_PRETE'; v_action := 'reused';
      select coalesce(registration_fee, v_global_reg)::int,
             coalesce(tuition_amount, (select amount from public.tuition_levels where level = r.level))::int
        into v_reg, v_scol
        from public.classes where id = v_cid;
    end if;

    -- Offre ADDITIVE : crée ou ré-ouvre la combinaison sélectionnée. Jamais de fermeture.
    insert into public.intake_offerings (intake_id, filiere_id, level, status)
    values (p_intake_id, r.filiere_id, r.level, 'open')
    on conflict (intake_id, filiere_id, level) do update set status = 'open';

    v_rows := v_rows || jsonb_build_object(
      'filiere_id', r.filiere_id, 'filiere_name', v_fname, 'level', r.level,
      'status', v_status, 'class_id', v_cid,
      'registration_fee', v_reg, 'tuition_due', v_scol,
      'action', v_action || '+offering_opened'
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'summary', jsonb_build_object('selected', v_selected, 'to_create', v_to_create,
                                  'ready', v_ready, 'blocking', 0),
    'rows', v_rows
  );
end $$;

-- EXECUTE : retirer à PUBLIC/anon, accorder à authenticated (garde interne rejette les non-admin).
revoke all on function public.configure_intake_offerings(uuid, jsonb, boolean) from public;
revoke all on function public.configure_intake_offerings(uuid, jsonb, boolean) from anon;
grant execute on function public.configure_intake_offerings(uuid, jsonb, boolean) to authenticated;

-- ============================================================================
-- ROLLBACK (bloc de secours, non destructif des données) :
-- drop function if exists public.configure_intake_offerings(uuid, jsonb, boolean);
-- ============================================================================
