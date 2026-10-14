-- =============================================================================
-- D6-1 — Besoins en personnel (staffing_requests)
-- =============================================================================
-- Règle institutionnelle ABSOLUE :
--   • Le Directeur des Études (DÉ) EXPRIME / SUIT un besoin.
--   • L'Administrateur Général (role 'admin') + super_admin DÉCIDENT seuls :
--     valident / refusent / affectent officiellement.
--   • Le workflow NE crée aucun compte, NE transforme aucune candidature en
--     salarié, NE change aucun rôle (aucun nouveau rôle en D6-1), NE recrute
--     personne. assigned_profile_id = profil DÉJÀ EXISTANT ET ÉLIGIBLE comme
--     personnel IPMD (rôle staff OU membre d'une équipe staff), choisi par l'AG.
--
-- Garanties techniques (ajustements D6-1) :
--   1) Transitions ATOMIQUES : UPDATE ... WHERE id=? AND status=<attendu>
--      RETURNING → en cas de concurrence, une seule transition réussit.
--   2) RPC SECURITY DEFINER verrouillées : search_path figé ; REVOKE public/anon ;
--      rôle vérifié CÔTÉ DB (current_user_role()/auth.uid()), jamais le client.
--      Colonnes protégées modifiables UNIQUEMENT via RPC : double garde-fou =
--      jeton de transaction (= txid_current()) ET contexte privilégié (role
--      superuser/bypassrls du definer) — un UPDATE direct authenticated échoue.
--   3) Cohérence des statuts garantie en base par CHECK (pas que l'UI).
--   4) Éligibilité du profil affecté vérifiée (pas seulement l'existence).
--   5) Snapshots serveur (requester_name, assigned_profile_name) → l'historique
--      survit à la disparition d'un profil. FK institutionnelles en RESTRICT
--      (préserver la référence ; IPMD archive au lieu de supprimer). Aucune
--      cascade destructrice. Aucun DELETE (ni policy, ni droit).
--   • Audit via le journal immuable D3/D3.1 (log_audit + snapshot acteur) :
--     exactement UNE trace par transition (création/soumission/validation/
--     refus+motif/affectation+personne/clôture).
-- =============================================================================

-- 1) TABLE -------------------------------------------------------------------
create table if not exists public.staffing_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Demandeur (DÉ) : forcé côté serveur à auth.uid() (cf. trigger creator).
  -- SET NULL : si le compte disparaît, le besoin reste (nom conservé ci-dessous).
  requester_id    uuid references public.profiles(id) on delete set null,
  requester_name  text,  -- snapshot serveur, figé à la création.

  -- Contenu du besoin (éditable uniquement en brouillon par le DÉ).
  need_type       text not null
                  check (need_type in ('enseignant','assistant','personnel_admin',
                                       'responsable','consultant','autre')),
  position_title  text not null,
  -- Références institutionnelles : RESTRICT (préserver le contexte ; IPMD archive).
  academic_year   text references public.academic_years(year) on delete restrict,
  module_id       uuid references public.modules(id)  on delete restrict,
  class_id        uuid references public.classes(id)  on delete restrict,
  justification   text not null,
  priority        text not null default 'normale'
                  check (priority in ('basse','normale','haute','urgente')),
  -- Suggestion LIBRE du DÉ (jamais un compte, jamais une affectation).
  proposed_profile text,

  -- Cycle de vie.
  status          text not null default 'brouillon'
                  check (status in ('brouillon','en_attente','validee',
                                    'refusee','affectee','cloturee')),

  -- Décision (AG/super uniquement, via RPC).
  decided_by      uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  decision_reason text,

  -- Affectation officielle (AG/super uniquement, via RPC). Profil EXISTANT+ÉLIGIBLE.
  assigned_profile_id   uuid references public.profiles(id) on delete set null,
  assigned_profile_name text,  -- snapshot serveur, figé à l'affectation.
  assigned_at     timestamptz,

  -- Clôture.
  closed_by       uuid references public.profiles(id) on delete set null,
  closed_at       timestamptz
);

-- 3) COHÉRENCE DES STATUTS (indépendante de l'UI) ----------------------------
-- Fondée sur les HORODATAGES + motif + snapshot (jamais remis à NULL par un
-- cascade FK) → l'état reste cohérent même si le profil décideur/affecté est
-- supprimé un jour (les *_by passent à NULL, l'identité reste dans audit_log
-- + dans assigned_profile_name). L'horodatage prouve que l'acte a bien eu lieu.
-- (ALTER idempotent : re-jouable et synchronise la table existante.)
alter table public.staffing_requests drop constraint if exists staffing_status_consistency;
alter table public.staffing_requests add constraint staffing_status_consistency check (
      (status <> 'validee'  or decided_at is not null)
  and (status <> 'refusee'  or (decided_at is not null
                                and btrim(coalesce(decision_reason,'')) <> ''))
  and (status <> 'affectee' or (assigned_at is not null and decided_at is not null
                                and assigned_profile_name is not null))
  and (status <> 'cloturee' or closed_at is not null)
);

comment on table public.staffing_requests is
  'Besoins en personnel : le DÉ exprime/suit ; l''AG (admin)+super_admin décident. '
  'Transitions via RPC dédiées. Aucun compte créé, aucun rôle changé, aucun DELETE.';

create index if not exists staffing_requests_requester_idx on public.staffing_requests(requester_id);
create index if not exists staffing_requests_status_idx    on public.staffing_requests(status);

-- 2a) SNAPSHOT CRÉATION : demandeur déterminé CÔTÉ SERVEUR (jamais le client) -
create or replace function public.staffing_set_creator()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- Le demandeur est TOUJOURS l'utilisateur authentifié (anti-usurpation),
  -- et son nom est figé en snapshot serveur.
  new.requester_id   := auth.uid();
  new.requester_name := (select full_name from public.profiles where id = auth.uid());
  return new;
end $$;

drop trigger if exists trg_staffing_set_creator on public.staffing_requests;
create trigger trg_staffing_set_creator
  before insert on public.staffing_requests
  for each row execute function public.staffing_set_creator();

-- 2b) GARDE : colonnes protégées modifiables UNIQUEMENT via RPC dédiée --------
-- SECURITY INVOKER (pas DEFINER) → current_user reflète le contexte réel de
-- l'UPDATE : 'postgres' (superuser) à l'intérieur d'une RPC SECURITY DEFINER,
-- 'authenticated' pour un UPDATE direct. Double garde-fou : jeton de transaction
-- ET contexte privilégié. Le jeton seul ne suffit pas.
create or replace function public.guard_staffing_request()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_priv boolean; v_protected boolean;
begin
  if tg_op = 'UPDATE' then
    -- Colonnes de transition (jamais remises à NULL par un cascade FK système).
    v_protected := (new.status              is distinct from old.status
        or new.created_at       is distinct from old.created_at
        or new.requester_name   is distinct from old.requester_name
        or new.decided_at       is distinct from old.decided_at
        or new.decision_reason  is distinct from old.decision_reason
        or new.assigned_profile_name is distinct from old.assigned_profile_name
        or new.assigned_at      is distinct from old.assigned_at
        or new.closed_at        is distinct from old.closed_at);
    -- Colonnes FK « acteur » : les faire pointer vers une valeur NON NULLE est une
    -- écriture applicative (interdite hors RPC) ; leur passage à NULL est un
    -- cascade FK système (ON DELETE SET NULL) → autorisé, le besoin survit.
    if (new.requester_id        is distinct from old.requester_id        and new.requester_id        is not null)
       or (new.decided_by       is distinct from old.decided_by          and new.decided_by          is not null)
       or (new.assigned_profile_id is distinct from old.assigned_profile_id and new.assigned_profile_id is not null)
       or (new.closed_by        is distinct from old.closed_by           and new.closed_by           is not null)
    then
      v_protected := true;
    end if;

    if v_protected then
      -- Double garde-fou : jeton de transaction ET contexte privilégié (le role
      -- effectif de l'UPDATE est superuser/bypassrls uniquement à l'intérieur
      -- d'une RPC SECURITY DEFINER ; un UPDATE direct authenticated échoue).
      select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv
        from pg_roles where rolname = current_user;
      if current_setting('app.staffing_tx', true) is distinct from txid_current()::text
         or not v_priv then
        raise exception 'staffing_requests: statut/décision/affectation/clôture '
          'uniquement via les RPC dédiées (contexte privilégié requis)';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_staffing_request on public.staffing_requests;
create trigger trg_guard_staffing_request
  before update on public.staffing_requests
  for each row execute function public.guard_staffing_request();

-- 2c) AUDIT CRÉATION (les transitions sont loggées par leurs RPC) -------------
create or replace function public.staffing_audit_create()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.log_audit(
    'create', 'staffing_create', 'staffing_request', new.id,
    null, new.class_id, new.module_id, null,
    null,
    jsonb_build_object('need_type',new.need_type,'position_title',new.position_title,
                       'priority',new.priority,'status',new.status),
    null,
    'Création brouillon besoin: '||coalesce(new.position_title,'?'), null::jsonb);
  return new;
end $$;

drop trigger if exists trg_staffing_audit_create on public.staffing_requests;
create trigger trg_staffing_audit_create
  after insert on public.staffing_requests
  for each row execute function public.staffing_audit_create();

-- 4) RLS ---------------------------------------------------------------------
alter table public.staffing_requests enable row level security;

-- SELECT : le DÉ voit SES besoins ; l'AG/super voient tout.
drop policy if exists "staffing DE read own" on public.staffing_requests;
create policy "staffing DE read own" on public.staffing_requests
  for select using (
    public.current_user_role() = 'directeur_etudes'::public.user_role
    and requester_id = auth.uid()
  );

drop policy if exists "staffing AG read all" on public.staffing_requests;
create policy "staffing AG read all" on public.staffing_requests
  for select using (
    public.current_user_role() in ('admin'::public.user_role,'super_admin'::public.user_role)
  );

-- INSERT : le DÉ seul, un brouillon, sans champ de décision. (requester_id est
-- de toute façon réécrit à auth.uid() par le trigger creator.)
drop policy if exists "staffing DE insert draft" on public.staffing_requests;
create policy "staffing DE insert draft" on public.staffing_requests
  for insert with check (
    public.current_user_role() = 'directeur_etudes'::public.user_role
    and status = 'brouillon'
    and decided_by is null and decided_at is null
    and assigned_profile_id is null and assigned_at is null
    and closed_by is null and closed_at is null
  );

-- UPDATE : le DÉ édite UNIQUEMENT le CONTENU de SON brouillon. WITH CHECK garde
-- status='brouillon' (il ne peut pas passer en_attente par UPDATE direct) ; le
-- guard bloque tout changement de colonne protégée. Aucune policy UPDATE pour
-- l'AG : ses actions passent toutes par les RPC.
drop policy if exists "staffing DE edit draft" on public.staffing_requests;
create policy "staffing DE edit draft" on public.staffing_requests
  for update
  using (
    public.current_user_role() = 'directeur_etudes'::public.user_role
    and requester_id = auth.uid()
    and status = 'brouillon'
  )
  with check (
    public.current_user_role() = 'directeur_etudes'::public.user_role
    and requester_id = auth.uid()
    and status = 'brouillon'
  );

-- AUCUNE policy DELETE. + REVOKE explicite : personne ne supprime un besoin.
revoke delete on public.staffing_requests from anon, authenticated;

-- 5) RPC DE TRANSITION (atomiques, SECURITY DEFINER verrouillées) ------------

-- 5a) SOUMISSION : DÉ demandeur, brouillon → en_attente.
create or replace function public.staffing_submit(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_class uuid; v_module uuid; v_found boolean := false;
begin
  if public.current_user_role() <> 'directeur_etudes'::public.user_role then
    raise exception 'seul le DÉ peut soumettre un besoin';
  end if;
  perform set_config('app.staffing_tx', txid_current()::text, true);
  update public.staffing_requests
     set status = 'en_attente'
   where id = p_id and status = 'brouillon' and requester_id = auth.uid()
   returning class_id, module_id into v_class, v_module;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'soumission impossible: besoin inexistant, non vôtre, ou déjà soumis';
  end if;
  perform public.log_audit('update','staffing_submit','staffing_request',p_id,
    null,v_class,v_module,null,
    jsonb_build_object('status','brouillon'),jsonb_build_object('status','en_attente'),
    null,'Soumission besoin pour décision AG', null::jsonb);
end $$;

-- 5b) DÉCISION : AG/super, en_attente → validee | refusee (motif requis si refus).
create or replace function public.staffing_decide(p_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_class uuid; v_module uuid; v_new text; v_found boolean := false;
begin
  if public.current_user_role() not in ('admin'::public.user_role,'super_admin'::public.user_role) then
    raise exception 'seul l''Administrateur Général peut décider';
  end if;
  if not p_approve and coalesce(btrim(p_reason),'') = '' then
    raise exception 'un motif est obligatoire pour refuser un besoin';
  end if;
  v_new := case when p_approve then 'validee' else 'refusee' end;
  perform set_config('app.staffing_tx', txid_current()::text, true);
  update public.staffing_requests
     set status = v_new, decided_by = auth.uid(), decided_at = now(),
         decision_reason = p_reason
   where id = p_id and status = 'en_attente'
   returning class_id, module_id into v_class, v_module;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'décision impossible: besoin inexistant ou déjà décidé (plus en attente)';
  end if;
  perform public.log_audit(case when p_approve then 'validate' else 'cancel' end,
    case when p_approve then 'staffing_validate' else 'staffing_refuse' end,
    'staffing_request',p_id,null,v_class,v_module,null,
    jsonb_build_object('status','en_attente'),jsonb_build_object('status',v_new),
    p_reason, case when p_approve then 'Besoin validé par AG' else 'Besoin refusé par AG' end, null::jsonb);
end $$;

-- 5c) AFFECTATION : AG/super, validee → affectee. Profil EXISTANT ET ÉLIGIBLE.
create or replace function public.staffing_assign(p_id uuid, p_profile uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_class uuid; v_module uuid; v_name text; v_prole public.user_role; v_found boolean := false;
begin
  if public.current_user_role() not in ('admin'::public.user_role,'super_admin'::public.user_role) then
    raise exception 'seul l''Administrateur Général peut affecter';
  end if;
  select role, full_name into v_prole, v_name from public.profiles where id = p_profile;
  if not found then
    raise exception 'profil affecté inexistant : l''affectation désigne un profil déjà créé';
  end if;
  -- ÉLIGIBILITÉ (ajustement 4) : rôle staff OU membre d'une équipe staff. Un
  -- étudiant / parent / apprenant (professionnel, dirigeant) est REFUSÉ.
  if v_prole not in ('enseignant'::public.user_role,'admin'::public.user_role,
                     'super_admin'::public.user_role,'scolarite'::public.user_role,
                     'pedagogie'::public.user_role,'directeur_etudes'::public.user_role)
     and not exists (select 1 from public.staff_team_members where profile_id = p_profile) then
    raise exception 'profil non éligible comme personnel IPMD (étudiant/parent/apprenant)';
  end if;
  perform set_config('app.staffing_tx', txid_current()::text, true);
  update public.staffing_requests
     set status = 'affectee', assigned_profile_id = p_profile,
         assigned_profile_name = coalesce(v_name, '(nom indisponible)'), assigned_at = now()
   where id = p_id and status = 'validee'
   returning class_id, module_id into v_class, v_module;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'affectation impossible: besoin inexistant ou pas au statut « validée »';
  end if;
  perform public.log_audit('update','staffing_assign','staffing_request',p_id,
    null,v_class,v_module,null,
    jsonb_build_object('status','validee'),
    jsonb_build_object('status','affectee','assigned_profile_id',p_profile,'assigned_profile_name',v_name),
    null,'Affectation officielle : '||coalesce(v_name,'?'), null::jsonb);
end $$;

-- 5d) CLÔTURE : AG/super depuis (validee|refusee|affectee) ; DÉ demandeur
--     UNIQUEMENT depuis affectee (besoin effectivement satisfait).
create or replace function public.staffing_close(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_class uuid; v_module uuid; v_role public.user_role; v_found boolean := false;
begin
  v_role := public.current_user_role();
  perform set_config('app.staffing_tx', txid_current()::text, true);
  if v_role in ('admin'::public.user_role,'super_admin'::public.user_role) then
    update public.staffing_requests
       set status = 'cloturee', closed_by = auth.uid(), closed_at = now()
     where id = p_id and status in ('validee','refusee','affectee')
     returning class_id, module_id into v_class, v_module;
    get diagnostics v_found = row_count;
    if not v_found then
      raise exception 'clôture impossible: besoin inexistant ou statut non clôturable';
    end if;
  elsif v_role = 'directeur_etudes'::public.user_role then
    update public.staffing_requests
       set status = 'cloturee', closed_by = auth.uid(), closed_at = now()
     where id = p_id and status = 'affectee' and requester_id = auth.uid()
     returning class_id, module_id into v_class, v_module;
    get diagnostics v_found = row_count;
    if not v_found then
      raise exception 'clôture impossible: le DÉ ne clôture que SON besoin déjà affecté';
    end if;
  else
    raise exception 'droit insuffisant pour clôturer';
  end if;
  perform public.log_audit('archive','staffing_close','staffing_request',p_id,
    null,v_class,v_module,null,
    null,jsonb_build_object('status','cloturee'),
    null,'Clôture du besoin', null::jsonb);
end $$;

-- Droits d'exécution : vérification de rôle INTERNE à chaque RPC.
revoke execute on function public.staffing_submit(uuid)               from public, anon;
revoke execute on function public.staffing_decide(uuid, boolean, text) from public, anon;
revoke execute on function public.staffing_assign(uuid, uuid)          from public, anon;
revoke execute on function public.staffing_close(uuid)                 from public, anon;
grant  execute on function public.staffing_submit(uuid)               to authenticated;
grant  execute on function public.staffing_decide(uuid, boolean, text) to authenticated;
grant  execute on function public.staffing_assign(uuid, uuid)          to authenticated;
grant  execute on function public.staffing_close(uuid)                 to authenticated;
