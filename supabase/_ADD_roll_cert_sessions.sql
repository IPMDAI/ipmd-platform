-- =============================================================================
-- Reconduction annuelle des SESSIONS certificat (formules) — fonction idempotente.
-- -----------------------------------------------------------------------------
-- Chaque année, l'admin CONFIRME les dates (contraintes : mardi/mercredi/jeudi +
-- 3e/4e semaine + hors fériés/fêtes islamiques) puis appelle cette fonction avec
-- le millésime + les sessions datées. La fonction :
--   • upsert chaque intake (garde anti-doublon = UNIQUE(academic_year,label)) ;
--   • crée les offerings des formules dont la durée est listée pour la session,
--     UNIQUEMENT si absentes (pas de doublon : offerings sans contrainte unique) ;
--   • sort_order = YYYYMM (ordre chronologique).
-- Réexécutable sans risque : ne duplique jamais, met à jour date/statut si besoin.
--
-- p_sessions (jsonb) : [{ "label":"Certificats - Octobre 2027",
--                         "start":"2027-10-20", "status":"open"|"planned",
--                         "durations":[0,1,3,6,10,36] }, ...]
--   durations = durées de formule ouvertes à cette session (0=court,1,3,6,
--   10=parcours Exec, 36=parcours 3 ans). Ex. mois court/1mois → [0,1] ;
--   3 mois → sessions incluant 3 ; parcours → sessions incluant 10 et 36.
-- Sécurité : service_role uniquement.
-- =============================================================================
create or replace function public.roll_certificate_sessions(p_year text, p_sessions jsonb)
returns jsonb
language plpgsql
security definer
-- search_path FIXE incluant public : l'insert d'offering déclenche le trigger
-- trg_catalog_offering_guard qui référence catalog_items/catalog_types NON qualifiés.
set search_path = public, pg_temp
as $function$
declare
  s jsonb; v_intake uuid; v_status text; v_intake_status text; v_off_status text;
  v_sessions int := 0; v_off int := 0; d int;
begin
  if p_year is null or p_year !~ '^\d{4}-\d{4}$' then
    raise exception 'roll_certificate_sessions: annee invalide (attendu AAAA-AAAA) : %', p_year;
  end if;
  if p_sessions is null or jsonb_typeof(p_sessions) <> 'array' then
    raise exception 'roll_certificate_sessions: p_sessions doit etre un tableau JSON';
  end if;

  for s in select * from jsonb_array_elements(p_sessions) loop
    if (s->>'label') is null or (s->>'start') is null then
      raise exception 'roll_certificate_sessions: session sans label/start : %', s;
    end if;
    -- Visibilité demandée : 'open' (ouverte) ou 'planned' (future, invisible).
    -- Mappée sur les statuts propres à chaque table : intake preparation/open,
    -- offering planned/open (le loader ne montre que open+open).
    v_status := coalesce(s->>'status','open');
    if v_status not in ('open','planned') then
      raise exception 'roll_certificate_sessions: statut attendu open|planned : %', v_status;
    end if;
    v_intake_status := case when v_status='open' then 'open' else 'preparation' end;
    v_off_status    := case when v_status='open' then 'open' else 'planned' end;

    insert into public.intakes (label, academic_year, start_date, status, sort_order)
    values (s->>'label', p_year, (s->>'start')::date, v_intake_status,
            to_char((s->>'start')::date,'YYYYMM')::int)
    on conflict (academic_year, label) do update
      set start_date = excluded.start_date,
          status     = excluded.status,
          sort_order = excluded.sort_order
    returning id into v_intake;
    v_sessions := v_sessions + 1;

    insert into public.catalog_offerings (item_id, intake_id, status, price, level)
    select ci.id, v_intake, v_off_status, ci.price, null
    from public.catalog_items ci
    where ci.is_formula
      and ci.duration_months in (
        select (value)::int from jsonb_array_elements_text(s->'durations')
      )
      and not exists (
        select 1 from public.catalog_offerings co
        where co.item_id = ci.id and co.intake_id = v_intake
      );
    get diagnostics d = row_count;
    v_off := v_off + d;
  end loop;

  return jsonb_build_object('annee', p_year, 'sessions_traitees', v_sessions, 'offerings_crees', v_off);
end
$function$;

revoke all on function public.roll_certificate_sessions(text, jsonb) from public, anon, authenticated;
grant execute on function public.roll_certificate_sessions(text, jsonb) to service_role;
