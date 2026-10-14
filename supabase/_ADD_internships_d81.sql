-- =============================================================================
-- D8-1 — Stage + Entreprise d'accueil + Encadreur + squelette Convention
-- =============================================================================  DRY-RUN — NON APPLIQUÉ (v2, 6 ajustements)
-- Frontière : DÉ = pilote PÉDAGOGIQUE ; AG = engagement juridique (D8-5).
-- Pérennité (D3/D6/D7) : AUCUN DELETE métier, aucune cascade destructrice,
-- snapshots humains, historique conservé.
-- Confidentialité : l'étudiant NE lit PAS les tables en direct (colonnes
-- internes/notes/audit) → RPC `student_my_internships()` restreinte à SON stage.
-- Après `a_valider`, les champs structurants ne sont plus éditables par UPDATE
-- générique : corrections sensibles via RPC dédiée (motif + audit).
-- Audit UNIQUE : trigger audit_row sur les 3 tables (1 action = 1 trace ; jamais
-- trigger + log_audit en doublon). Motif injecté via GUC app.audit_reason (D7-2).
-- =============================================================================

-- 1) ENTREPRISE D'ACCUEIL — fiche OPÉRATIONNELLE (≠ partenaire officiel IPMD).
create table if not exists public.host_companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sector      text,
  city        text,
  country     text,
  address     text,
  website     text,
  notes       text,                                      -- notes INTERNES (jamais exposées à l'étudiant)
  status      text not null default 'actif' check (status in ('actif','archive')),
  archived_at timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Cohérence : actif ⇔ archived_at NULL ; archive ⇔ archived_at renseigné.
  constraint host_companies_archive_chk check (
    (status = 'actif' and archived_at is null) or (status = 'archive' and archived_at is not null))
);
comment on table public.host_companies is
  'Fiche OPÉRATIONNELLE d''un lieu de stage (DÉ). N''est PAS un partenariat '
  'institutionnel / convention-cadre / partenaire officiel IPMD (réservés AG). '
  'Archivable (status=archive) : reste liée aux stages passés, retirée des choix.';

-- 2) STAGE — entité avec cycle de vie.
create table if not exists public.internships (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id) on delete set null,

  student_id      uuid references public.profiles(id) on delete set null,
  student_name    text,                                   -- snapshot serveur

  academic_year   text references public.academic_years(year) on delete restrict,
  host_company_id uuid references public.host_companies(id) on delete restrict,
  start_date      date,
  end_date        date,
  title           text not null,
  mission         text,

  -- Maître de stage EXTERNE : information de suivi, PAS de compte IPMD.
  supervisor_name     text,
  supervisor_function text,
  supervisor_email    text,
  supervisor_phone    text,

  -- Encadreur académique (enseignant IPMD éligible) — via RPC dédiée.
  academic_advisor_id   uuid references public.profiles(id) on delete set null,
  academic_advisor_name text,                             -- snapshot serveur

  module_id       uuid references public.modules(id) on delete set null,

  status          text not null default 'brouillon'
                  check (status in ('brouillon','a_valider','valide','en_cours','termine','annule')),
  validated_by    uuid references public.profiles(id) on delete set null,
  validated_at    timestamptz,

  constraint internships_dates_chk check (start_date is null or end_date is null or end_date >= start_date),
  constraint internships_validated_chk check (status not in ('valide','en_cours','termine') or validated_at is not null)
);
comment on table public.internships is
  'Stage étudiant (pilotage DÉ). brouillon→a_valider→valide→en_cours→termine (+annule). '
  'Contenu éditable seulement en brouillon ; au-delà, corrections via RPC. Aucun DELETE.';
create index if not exists internships_student_idx on public.internships(student_id);
create index if not exists internships_status_idx  on public.internships(status);
create index if not exists internships_year_idx     on public.internships(academic_year);

-- 3) CONVENTION DE STAGE — squelette (suivi minimal ; signature AG = D8-5).
create table if not exists public.internship_conventions (
  id            uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships(id) on delete restrict,
  version       int not null default 1 check (version >= 1),
  status        text not null default 'en_preparation'
                check (status in ('en_preparation','a_signer','signee','annulee')),
  prepared_at   timestamptz,
  -- Réservés D8-5 (signature AG) : jamais posés par le DÉ (garde). signed_document_id
  -- SANS FK pour l'instant (cible student_documents vs submission décidée en D8-5).
  signed_at     timestamptz,
  signed_by     uuid references public.profiles(id) on delete set null,
  signed_document_id uuid,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint internship_conventions_uq unique (internship_id, version)
);
comment on table public.internship_conventions is
  'Convention de stage (≠ convention d''inscription). Le DÉ prépare/transmet ; '
  'seul l''AG signe juridiquement (D8-5). UNIQUE(internship_id, version).';

-- 4) SNAPSHOT CRÉATION (student_name + created_by serveur) ---------------------
create or replace function public.internship_set_creator()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.created_by   := auth.uid();
  new.student_name := (select full_name from public.profiles where id = new.student_id);
  return new;
end $$;
drop trigger if exists trg_internship_set_creator on public.internships;
create trigger trg_internship_set_creator
  before insert on public.internships
  for each row execute function public.internship_set_creator();

-- 5) GARDES : colonnes sensibles modifiables UNIQUEMENT via RPC ----------------
-- (jeton app.internship_tx + contexte privilégié ; cf. D7-2).
create or replace function public.guard_internship()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_priv boolean;
begin
  if tg_op = 'UPDATE' then
    if (new.status                is distinct from old.status
        or new.academic_advisor_id   is distinct from old.academic_advisor_id
        or new.academic_advisor_name is distinct from old.academic_advisor_name
        or new.validated_by        is distinct from old.validated_by
        or new.validated_at        is distinct from old.validated_at
        or new.student_id          is distinct from old.student_id
        or new.student_name        is distinct from old.student_name
        or new.created_by          is distinct from old.created_by
        or new.created_at          is distinct from old.created_at)
    then
      select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv from pg_roles where rolname = current_user;
      if current_setting('app.internship_tx', true) is distinct from txid_current()::text or not v_priv then
        raise exception 'statut/encadreur/validation du stage : uniquement via les RPC dédiées';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_internship on public.internships;
create trigger trg_guard_internship before update on public.internships
  for each row execute function public.guard_internship();

-- Contrôle DB : on ne peut lier/relier un stage qu'à une entreprise ACTIVE
-- (une entreprise archivée reste sur les anciens stages mais n'est plus choisissable).
-- SECURITY DEFINER pour lire host_companies.status quel que soit l'appelant.
create or replace function public.guard_internship_company_active()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_target uuid; begin
  if tg_op = 'INSERT' then v_target := new.host_company_id;
  elsif new.host_company_id is distinct from old.host_company_id then v_target := new.host_company_id;
  else return new; end if;
  if v_target is not null and (select status from public.host_companies where id = v_target) <> 'actif' then
    raise exception 'entreprise d''accueil archivée : non sélectionnable pour un stage';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_internship_company on public.internships;
create trigger trg_guard_internship_company before insert or update on public.internships
  for each row execute function public.guard_internship_company_active();

create or replace function public.guard_internship_convention()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_priv boolean;
begin
  if tg_op = 'UPDATE' then
    if (new.status is distinct from old.status
        or new.signed_at is distinct from old.signed_at
        or new.signed_by is distinct from old.signed_by
        or new.signed_document_id is distinct from old.signed_document_id
        or new.version is distinct from old.version
        or new.internship_id is distinct from old.internship_id)
    then
      select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv from pg_roles where rolname = current_user;
      if current_setting('app.internship_tx', true) is distinct from txid_current()::text or not v_priv then
        raise exception 'statut/signature de la convention : uniquement via les RPC dédiées';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_convention on public.internship_conventions;
create trigger trg_guard_convention before update on public.internship_conventions
  for each row execute function public.guard_internship_convention();

-- 6) AUDIT : trigger audit_row (UNIQUE écrivain) sur les 3 tables --------------
drop trigger if exists trg_audit_internships on public.internships;
create trigger trg_audit_internships after insert or update on public.internships
  for each row execute function public.audit_row();
drop trigger if exists trg_audit_host_companies on public.host_companies;
create trigger trg_audit_host_companies after insert or update on public.host_companies
  for each row execute function public.audit_row();
drop trigger if exists trg_audit_conventions on public.internship_conventions;
create trigger trg_audit_conventions after insert or update on public.internship_conventions
  for each row execute function public.audit_row();

-- 7) RLS -----------------------------------------------------------------------
alter table public.host_companies         enable row level security;
alter table public.internships            enable row level security;
alter table public.internship_conventions enable row level security;

-- host_companies : staff pédagogique SEULEMENT (l'étudiant passe par la RPC).
drop policy if exists "hc staff manage" on public.host_companies;
create policy "hc staff manage" on public.host_companies for all
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'))
  with check (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
revoke delete on public.host_companies from anon, authenticated;

-- internships : staff SELECT tous + INSERT brouillon + UPDATE CONTENU en brouillon
-- UNIQUEMENT. L'étudiant NE lit PAS la table en direct (→ RPC student_my_internships).
drop policy if exists "intern staff read" on public.internships;
create policy "intern staff read" on public.internships for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
drop policy if exists "intern staff insert" on public.internships;
create policy "intern staff insert" on public.internships for insert
  with check (public.current_user_role() in ('directeur_etudes','admin','super_admin')
              and status = 'brouillon' and student_id is not null
              and validated_by is null and validated_at is null);
drop policy if exists "intern staff update draft" on public.internships;
create policy "intern staff update draft" on public.internships for update
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin') and status = 'brouillon')
  with check (public.current_user_role() in ('directeur_etudes','admin','super_admin') and status = 'brouillon');
revoke delete on public.internships from anon, authenticated;

-- internship_conventions : staff SELECT/INSERT/UPDATE (le guard verrouille
-- statut/signature). Pas d'accès direct étudiant en D8-1.
drop policy if exists "conv staff manage" on public.internship_conventions;
create policy "conv staff manage" on public.internship_conventions for all
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'))
  with check (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
revoke delete on public.internship_conventions from anon, authenticated;

-- 8) RPC ÉTUDIANT (lecture restreinte de SON stage — champs utiles seulement) ---
-- Jamais : notes internes entreprise, champs admin, snapshots internes, audit.
create or replace function public.student_my_internships()
returns table(
  id uuid, title text, mission text, start_date date, end_date date, status text,
  company_name text, company_city text, academic_advisor_name text, module_name text,
  supervisor_name text, supervisor_function text, convention_status text)
language sql security definer set search_path to 'public' stable as $$
  select i.id, i.title, i.mission, i.start_date, i.end_date, i.status,
         hc.name, hc.city, i.academic_advisor_name, m.name,
         i.supervisor_name, i.supervisor_function,
         (select c.status from public.internship_conventions c
           where c.internship_id = i.id order by c.version desc limit 1)
  from public.internships i
  left join public.host_companies hc on hc.id = i.host_company_id
  left join public.modules m on m.id = i.module_id
  where i.student_id = auth.uid()
  order by i.created_at desc;
$$;
revoke execute on function public.student_my_internships() from public, anon;
grant  execute on function public.student_my_internships() to authenticated;

-- 9) RPC DE TRANSITION (DÉ/admin/super, atomiques, concurrence) -----------------
create or replace function public.internship_submit(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  update public.internships set status='a_valider' where id=p_id and status='brouillon';
  get diagnostics v = row_count; if not v then raise exception 'soumission impossible (statut ou concurrence)'; end if;
end $$;

create or replace function public.internship_validate(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  update public.internships set status='valide', validated_by=auth.uid(), validated_at=now() where id=p_id and status='a_valider';
  get diagnostics v = row_count; if not v then raise exception 'validation impossible (statut ou concurrence)'; end if;
end $$;

create or replace function public.internship_start(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  update public.internships set status='en_cours' where id=p_id and status='valide';
  get diagnostics v = row_count; if not v then raise exception 'démarrage impossible (statut ou concurrence)'; end if;
end $$;

create or replace function public.internship_finish(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  update public.internships set status='termine' where id=p_id and status='en_cours';
  get diagnostics v = row_count; if not v then raise exception 'clôture impossible (statut ou concurrence)'; end if;
end $$;

create or replace function public.internship_cancel(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.internships set status='annule' where id=p_id and status in ('brouillon','a_valider','valide','en_cours');
  get diagnostics v = row_count; if not v then raise exception 'annulation impossible (statut ou concurrence)'; end if;
end $$;

-- 10) RPC ENCADREUR (règle D7 is_pedagogically_eligible_teacher ; motif ; concurrence).
-- Autorisé UNIQUEMENT en brouillon/a_valider/valide/en_cours (termine/annule = fermé).
create or replace function public.internship_assign_advisor(
  p_id uuid, p_advisor uuid, p_expected_advisor uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; v_name text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if not public.is_pedagogically_eligible_teacher(p_advisor) then raise exception 'encadreur non éligible pédagogiquement'; end if;
  select full_name into v_name from public.profiles where id = p_advisor;
  perform set_config('app.internship_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.internships
     set academic_advisor_id = p_advisor, academic_advisor_name = coalesce(v_name,'(sans nom)')
   where id = p_id and academic_advisor_id is not distinct from p_expected_advisor
     and status in ('brouillon','a_valider','valide','en_cours');
  get diagnostics v = row_count;
  if not v then raise exception 'affectation impossible : stage introuvable, fermé, ou encadreur modifié entre-temps (concurrence)'; end if;
end $$;

-- 11) RPC CORRECTIONS SENSIBLES post-soumission (motif + audit). Le contenu libre
-- n'est éditable qu'en brouillon ; au-delà, entreprise/dates passent par ici.
-- Concurrence : valeur attendue (expected) ; ne changent JAMAIS le statut du stage ;
-- entreprise ACTIVE imposée par le trigger guard_internship_company_active.
create or replace function public.internship_change_company(p_id uuid, p_company uuid, p_expected_company uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.internships set host_company_id = p_company
   where id = p_id and status in ('a_valider','valide','en_cours')
     and host_company_id is not distinct from p_expected_company;
  get diagnostics v = row_count; if not v then raise exception 'changement d''entreprise impossible (statut ou concurrence)'; end if;
end $$;

create or replace function public.internship_change_dates(p_id uuid, p_start date, p_end date, p_expected_start date, p_expected_end date, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if p_start is not null and p_end is not null and p_end < p_start then raise exception 'dates incohérentes'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.internships set start_date = p_start, end_date = p_end
   where id = p_id and status in ('a_valider','valide','en_cours')
     and start_date is not distinct from p_expected_start and end_date is not distinct from p_expected_end;
  get diagnostics v = row_count; if not v then raise exception 'changement de dates impossible (statut ou concurrence)'; end if;
end $$;

-- Archivage entreprise (status + archived_at cohérents) — audité via audit_row.
create or replace function public.host_company_set_archived(p_id uuid, p_archived boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  update public.host_companies
     set status = case when p_archived then 'archive' else 'actif' end,
         archived_at = case when p_archived then now() else null end
   where id = p_id;
  get diagnostics v = row_count; if not v then raise exception 'entreprise introuvable'; end if;
end $$;

-- 12) RPC CONVENTION : préparation → transmission à signature (DÉ). Signature AG = D8-5.
create or replace function public.convention_submit_for_signature(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  update public.internship_conventions set status='a_signer', prepared_at=coalesce(prepared_at, now())
   where id=p_id and status='en_preparation';
  get diagnostics v = row_count; if not v then raise exception 'transmission impossible (statut ou concurrence)'; end if;
end $$;

-- Annulation d'une convention (en_preparation|a_signer → annulee) + motif + audit.
create or replace function public.convention_cancel(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.internship_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.internship_conventions set status='annulee'
   where id=p_id and status in ('en_preparation','a_signer');
  get diagnostics v = row_count; if not v then raise exception 'annulation impossible (statut ou concurrence)'; end if;
end $$;

-- Droits d'exécution.
do $$ declare f text; begin
  for f in select unnest(array[
    'internship_submit(uuid)','internship_validate(uuid)','internship_start(uuid)',
    'internship_finish(uuid)','internship_cancel(uuid,text)',
    'internship_assign_advisor(uuid,uuid,uuid,text)',
    'internship_change_company(uuid,uuid,uuid,text)','internship_change_dates(uuid,date,date,date,date,text)',
    'host_company_set_archived(uuid,boolean)','convention_submit_for_signature(uuid)',
    'convention_cancel(uuid,text)','student_my_internships()'])
  loop
    execute 'revoke execute on function public.'||f||' from public, anon';
    execute 'grant execute on function public.'||f||' to authenticated';
  end loop;
end $$;
