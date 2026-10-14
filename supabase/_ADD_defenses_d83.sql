-- =============================================================================
-- D8-3 — Jury + Soutenances (defenses + jury_members)   (v2 — 6 ajustements)
-- =============================================================================
-- DÉ pilote (jury, planning, report, suivi) ; AG = institutionnel (D8-5) ;
-- note/délibération/validation de cycle = D8-4. defenses = SOURCE métier de la
-- soutenance (course_sessions = rattachement planning optionnel et cohérent).
-- Sécurité : aucun DELETE métier (retrait jury = soft) ; mutations via RPC
-- uniquement ; motif pour report/annulation/retrait ; concurrence ; jury interne
-- PÉDAGOGIQUEMENT qualifié (teacher_profile valide/actif) ; externe sans compte ;
-- étudiant lit seulement SA soutenance (RPC, 0 RH). Audit audit_row = 1/entité.
-- =============================================================================

-- 1) SOUTENANCE (snapshots work_title + room_name pour lisibilité historique).
create table if not exists public.defenses (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles(id) on delete set null,
  student_id       uuid references public.profiles(id) on delete set null,
  student_name     text,
  academic_work_id uuid not null references public.academic_works(id) on delete restrict,
  work_title       text,                                   -- snapshot du titre
  academic_year    text references public.academic_years(year) on delete restrict,
  attempt          int not null,
  scheduled_at     timestamptz,
  room_id          uuid references public.rooms(id) on delete set null,
  room_name        text,                                   -- snapshot salle
  course_session_id uuid references public.course_sessions(id) on delete set null,
  status           text not null default 'a_planifier'
                   check (status in ('a_planifier','planifiee','tenue','annulee')),
  constraint defenses_attempt_uq unique (academic_work_id, attempt),
  constraint defenses_scheduled_chk check (status <> 'planifiee' or scheduled_at is not null)
);
comment on table public.defenses is
  'Soutenance d''un travail (academic_works). Plusieurs tentatives (attempt). '
  'defenses = source métier ; course_sessions = planning optionnel cohérent. Aucun DELETE.';
create index if not exists defenses_student_idx on public.defenses(student_id);
create index if not exists defenses_work_idx    on public.defenses(academic_work_id);
create index if not exists defenses_status_idx  on public.defenses(status);

-- 2) MEMBRES DU JURY (interne IPMD pédagogique OU externe sans compte).
create table if not exists public.jury_members (
  id            uuid primary key default gen_random_uuid(),
  defense_id    uuid not null references public.defenses(id) on delete restrict,
  member_type   text not null check (member_type in ('interne','externe')),
  profile_id    uuid references public.profiles(id) on delete set null,
  profile_name  text,
  external_name text,
  external_function text,
  external_organization text,
  role          text not null check (role in ('president','rapporteur','examinateur','autre')),
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  removed_at    timestamptz,
  removed_reason text,
  constraint jury_member_kind_chk check (
    (member_type='interne' and profile_id is not null and external_name is null)
    or (member_type='externe' and profile_id is null and external_name is not null))
);
create index if not exists jury_members_defense_idx on public.jury_members(defense_id);
-- Doublons incohérents (sur membres ACTIFS seulement ; réajout possible après retrait).
create unique index if not exists jury_one_active_president
  on public.jury_members(defense_id) where role='president' and removed_at is null;
create unique index if not exists jury_internal_once
  on public.jury_members(defense_id, profile_id) where member_type='interne' and removed_at is null;
create unique index if not exists jury_external_once
  on public.jury_members(defense_id, lower(external_name)) where member_type='externe' and removed_at is null;

-- 3) ÉLIGIBILITÉ JURY INTERNE (D8) : qualification PÉDAGOGIQUE obligatoire ------
-- teacher_profile valide/actif ET rôle institutionnel autorisé. Un scolarité/
-- apprenant/étudiant/parent n'est JAMAIS éligible par son rôle seul ; un admin/
-- super_admin l'est seulement s'il enseigne réellement (teacher_profile valide).
create or replace function public.is_jury_internal_eligible(p_profile uuid)
returns boolean language sql security definer set search_path to 'public' stable as $$
  select exists (
    select 1 from public.profiles p
    join public.teacher_profiles tp on tp.teacher_id = p.id
    where p.id = p_profile
      and tp.status in ('valide','actif')
      and p.role in ('enseignant','directeur_etudes','admin','super_admin'));
$$;
revoke execute on function public.is_jury_internal_eligible(uuid) from public, anon;
grant  execute on function public.is_jury_internal_eligible(uuid) to authenticated;

-- 4) AUDIT (unique écrivain) ---------------------------------------------------
drop trigger if exists trg_audit_defenses on public.defenses;
create trigger trg_audit_defenses after insert or update on public.defenses
  for each row execute function public.audit_row();
drop trigger if exists trg_audit_jury_members on public.jury_members;
create trigger trg_audit_jury_members after insert or update on public.jury_members
  for each row execute function public.audit_row();

-- 5) RLS : SELECT staff ; aucune écriture directe (tout via RPC) --------------
alter table public.defenses     enable row level security;
alter table public.jury_members enable row level security;
drop policy if exists "def staff read" on public.defenses;
create policy "def staff read" on public.defenses for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
drop policy if exists "jury staff read" on public.jury_members;
create policy "jury staff read" on public.jury_members for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
revoke delete on public.defenses     from anon, authenticated;
revoke delete on public.jury_members from anon, authenticated;

-- 6) RPC ÉTUDIANT (SA soutenance + jury, 0 RH ; membres retirés exclus) --------
create or replace function public.student_my_defenses()
returns table(id uuid, work_title text, attempt int, scheduled_at timestamptz,
              room_name text, status text, academic_year text)
language sql security definer set search_path to 'public' stable as $$
  select id, work_title, attempt, scheduled_at, room_name, status, academic_year
  from public.defenses where student_id = auth.uid()
  order by scheduled_at nulls last, attempt;
$$;
create or replace function public.student_my_defense_jury(p_defense uuid)
returns table(member_type text, display_name text, role text, organization text)
language sql security definer set search_path to 'public' stable as $$
  select jm.member_type,
         case when jm.member_type='interne' then jm.profile_name else jm.external_name end,
         jm.role,
         case when jm.member_type='externe' then jm.external_organization else null end
  from public.jury_members jm
  join public.defenses d on d.id = jm.defense_id
  where jm.defense_id = p_defense and jm.removed_at is null and d.student_id = auth.uid()
  order by jm.role;
$$;

-- 7) RPC PILOTAGE SOUTENANCE ---------------------------------------------------
-- Création : travail VALIDE + appartenant à l'étudiant ; attempt=max+1 concurrent-
-- safe (verrou sur le travail) ; interdit si une soutenance est déjà a_planifier/
-- planifiee (→ reschedule) ; snapshot work_title.
create or replace function public.defense_create(p_work uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare r public.academic_works; v_id uuid; v_attempt int; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  select * into r from public.academic_works where id = p_work for update;   -- verrou → concurrence
  if not found then raise exception 'travail académique introuvable'; end if;
  if r.status <> 'valide' then raise exception 'le travail doit être validé avant la soutenance'; end if;
  if exists (select 1 from public.defenses where academic_work_id=p_work and status in ('a_planifier','planifiee')) then
    raise exception 'une soutenance est déjà en cours pour ce travail (reprogrammez-la)'; end if;
  select coalesce(max(attempt),0)+1 into v_attempt from public.defenses where academic_work_id = p_work;
  insert into public.defenses(created_by, student_id, student_name, academic_work_id, work_title, academic_year, attempt)
  values (auth.uid(), r.student_id, (select full_name from public.profiles where id=r.student_id),
          p_work, r.title, r.academic_year, v_attempt)
  returning id into v_id;
  return v_id;
end $$;

-- Vérifie la cohérence d'une séance liée (type soutenance + date/heure/salle).
create or replace function public.defense_check_session(p_session uuid, p_at timestamptz, p_room uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_type text; v_date date; v_time time; v_room uuid; begin
  if p_session is null then return; end if;
  select type, session_date, start_time, room_id into v_type, v_date, v_time, v_room
    from public.course_sessions where id = p_session;
  if not found then raise exception 'séance liée introuvable'; end if;
  if v_type <> 'soutenance' then raise exception 'la séance liée doit être de type « soutenance »'; end if;
  if v_date <> (p_at at time zone 'UTC')::date or v_time <> (p_at at time zone 'UTC')::time
     or v_room is distinct from p_room then
    raise exception 'incohérence séance/soutenance (date/heure/salle)'; end if;
end $$;

create or replace function public.defense_schedule(p_id uuid, p_at timestamptz, p_room uuid, p_session uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if p_at is null then raise exception 'date/heure obligatoire'; end if;
  perform public.defense_check_session(p_session, p_at, p_room);
  update public.defenses set status='planifiee', scheduled_at=p_at, room_id=p_room,
         room_name=(select name from public.rooms where id=p_room), course_session_id=p_session
   where id=p_id and status='a_planifier';
  get diagnostics v = row_count; if not v then raise exception 'planification impossible (statut ou concurrence)'; end if;
end $$;

-- Report : motif + concurrence (date attendue) ; cohérence séance si fournie.
create or replace function public.defense_reschedule(p_id uuid, p_at timestamptz, p_room uuid, p_session uuid, p_expected_at timestamptz, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if p_at is null then raise exception 'date/heure obligatoire'; end if;
  perform public.defense_check_session(p_session, p_at, p_room);
  perform set_config('app.audit_reason', p_reason, true);
  update public.defenses set scheduled_at=p_at, room_id=p_room,
         room_name=(select name from public.rooms where id=p_room), course_session_id=p_session
   where id=p_id and status='planifiee' and scheduled_at is not distinct from p_expected_at;
  get diagnostics v = row_count; if not v then raise exception 'report impossible (statut ou concurrence)'; end if;
end $$;

-- Tenue : exige planifiée + au moins un juré actif + un président actif.
create or replace function public.defense_mark_held(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if not exists (select 1 from public.defenses where id=p_id and status='planifiee') then
    raise exception 'la soutenance doit être planifiée'; end if;
  if not exists (select 1 from public.jury_members where defense_id=p_id and removed_at is null) then
    raise exception 'au moins un membre de jury actif est requis'; end if;
  if not exists (select 1 from public.jury_members where defense_id=p_id and removed_at is null and role='president') then
    raise exception 'un président de jury actif est requis'; end if;
  update public.defenses set status='tenue' where id=p_id and status='planifiee';
  get diagnostics v = row_count; if not v then raise exception 'clôture impossible (concurrence)'; end if;
end $$;

create or replace function public.defense_cancel(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.defenses set status='annulee' where id=p_id and status in ('a_planifier','planifiee');
  get diagnostics v = row_count; if not v then raise exception 'annulation impossible (statut)'; end if;
end $$;

-- 8) RPC COMPOSITION JURY ------------------------------------------------------
create or replace function public.jury_add_internal(p_defense uuid, p_profile uuid, p_role text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_status text; v_id uuid; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if p_role not in ('president','rapporteur','examinateur','autre') then raise exception 'rôle invalide'; end if;
  if not public.is_jury_internal_eligible(p_profile) then raise exception 'membre interne non éligible (qualification pédagogique requise : teacher_profile valide/actif)'; end if;
  select status into v_status from public.defenses where id=p_defense;
  if v_status is null or v_status not in ('a_planifier','planifiee') then raise exception 'jury non modifiable (soutenance tenue/annulée)'; end if;
  insert into public.jury_members(defense_id, member_type, profile_id, profile_name, role, created_by)
  values (p_defense,'interne',p_profile,(select full_name from public.profiles where id=p_profile),p_role,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.jury_add_external(p_defense uuid, p_name text, p_function text, p_org text, p_role text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_status text; v_id uuid; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_name),'') = '' then raise exception 'nom du membre externe obligatoire'; end if;
  if p_role not in ('president','rapporteur','examinateur','autre') then raise exception 'rôle invalide'; end if;
  select status into v_status from public.defenses where id=p_defense;
  if v_status is null or v_status not in ('a_planifier','planifiee') then raise exception 'jury non modifiable (soutenance tenue/annulée)'; end if;
  insert into public.jury_members(defense_id, member_type, external_name, external_function, external_organization, role, created_by)
  values (p_defense,'externe',btrim(p_name),nullif(btrim(p_function),''),nullif(btrim(p_org),''),p_role,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.jury_remove(p_member uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.jury_members set removed_at=now(), removed_reason=p_reason where id=p_member and removed_at is null;
  get diagnostics v = row_count; if not v then raise exception 'retrait impossible (membre introuvable ou déjà retiré)'; end if;
end $$;

do $$ declare f text; begin
  for f in select unnest(array[
    'student_my_defenses()','student_my_defense_jury(uuid)','defense_create(uuid)',
    'defense_schedule(uuid,timestamptz,uuid,uuid)','defense_reschedule(uuid,timestamptz,uuid,uuid,timestamptz,text)',
    'defense_mark_held(uuid)','defense_cancel(uuid,text)',
    'jury_add_internal(uuid,uuid,text)','jury_add_external(uuid,text,text,text,text)','jury_remove(uuid,text)'])
  loop
    execute 'revoke execute on function public.'||f||' from public, anon';
    execute 'grant execute on function public.'||f||' to authenticated';
  end loop;
end $$;
-- defense_check_session : helper interne (appelé par les RPC definer).
revoke execute on function public.defense_check_session(uuid,timestamptz,uuid) from public, anon;
