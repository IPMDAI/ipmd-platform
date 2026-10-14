-- =============================================================================
-- D8-2 — academic_works (mémoire / rapport de stage / PFE)   (v2 — 5 ajustements)
-- =============================================================================
-- Suivi MÉTIER ; le FICHIER/version réutilise student_documents + submissions
-- (bucket student-documents). Création UNIQUEMENT via RPC (validations DB).
-- Validation/correction = SYNC ATOMIQUE travail↔document (même transaction).
-- Ouverture idempotente/concurrent-safe = exactement 1 demande documentaire.
-- Cohérence stage garantie en base. Pérennité : aucun DELETE métier, snapshots.
-- Audit : 1 mutation d'une entité = 1 trace pour CETTE entité (academic_works ET
-- student_documents sont audités séparément — c'est voulu, pas un doublon).
-- =============================================================================

-- 0) Types documentaires des travaux (libellés officiels ; doc_key = PK).
insert into public.document_types (doc_key, label, sort_order, max_files) values
  ('memoire',       'Mémoire',                        20, 5),
  ('rapport_stage', 'Rapport de stage',               21, 5),
  ('pfe',           'Projet de fin d''études (PFE)',   22, 5)
on conflict (doc_key) do nothing;

-- 1) TABLE academic_works -----------------------------------------------------
create table if not exists public.academic_works (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id) on delete set null,
  student_id    uuid references public.profiles(id) on delete set null,
  student_name  text,
  academic_year text references public.academic_years(year) on delete restrict,
  work_type     text not null check (work_type in ('memoire','rapport_stage','pfe')),
  title         text not null,
  internship_id uuid references public.internships(id) on delete set null,
  academic_advisor_id   uuid references public.profiles(id) on delete set null,
  academic_advisor_name text,
  student_document_id uuid references public.student_documents(id) on delete set null,
  status        text not null default 'brouillon'
                check (status in ('brouillon','a_deposer','depose','valide','a_corriger','annule')),
  validated_by  uuid references public.profiles(id) on delete set null,
  validated_at  timestamptz,
  constraint academic_works_validated_chk check (status <> 'valide' or validated_at is not null)
);
comment on table public.academic_works is
  'Suivi métier d''un travail académique (mémoire/rapport_stage/pfe). Fichier/version '
  'via student_documents+submissions (réutilisé). Création via RPC. Aucun DELETE.';
create index if not exists academic_works_student_idx on public.academic_works(student_id);
create index if not exists academic_works_status_idx  on public.academic_works(status);
-- Concurrence/idempotence : un student_document appartient à AU PLUS un travail.
create unique index if not exists academic_works_doc_uq
  on public.academic_works(student_document_id) where student_document_id is not null;

-- 2) SNAPSHOT CRÉATION (created_by + student_name serveur) ---------------------
create or replace function public.academic_work_set_creator()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.created_by   := auth.uid();
  new.student_name := (select full_name from public.profiles where id = new.student_id);
  return new;
end $$;
drop trigger if exists trg_academic_work_set_creator on public.academic_works;
create trigger trg_academic_work_set_creator before insert on public.academic_works
  for each row execute function public.academic_work_set_creator();

-- 3) COHÉRENCE STAGE (DB) : si internship_id, il appartient au même étudiant ----
create or replace function public.guard_academic_work_internship()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.internship_id is not null then
    if (select student_id from public.internships where id = new.internship_id) is distinct from new.student_id then
      raise exception 'le stage lié doit appartenir au même étudiant';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_aw_internship on public.academic_works;
create trigger trg_guard_aw_internship before insert or update on public.academic_works
  for each row execute function public.guard_academic_work_internship();

-- 4) GARDE : statut/encadreur/validation/lien via RPC uniquement ---------------
create or replace function public.guard_academic_work()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_priv boolean;
begin
  if tg_op = 'UPDATE' then
    if (new.status is distinct from old.status
        or new.academic_advisor_id is distinct from old.academic_advisor_id
        or new.academic_advisor_name is distinct from old.academic_advisor_name
        or new.validated_by is distinct from old.validated_by
        or new.validated_at is distinct from old.validated_at
        or new.student_id is distinct from old.student_id
        or new.student_name is distinct from old.student_name
        or new.student_document_id is distinct from old.student_document_id
        or new.created_by is distinct from old.created_by
        or new.created_at is distinct from old.created_at)
    then
      select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv from pg_roles where rolname = current_user;
      if current_setting('app.academic_work_tx', true) is distinct from txid_current()::text or not v_priv then
        raise exception 'statut/encadreur/validation/lien du travail : uniquement via les RPC dédiées';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_academic_work on public.academic_works;
create trigger trg_guard_academic_work before update on public.academic_works
  for each row execute function public.guard_academic_work();

-- 5) AUDIT academic_works (unique écrivain) + SYNC dépôt étudiant → 'depose' ----
drop trigger if exists trg_audit_academic_works on public.academic_works;
create trigger trg_audit_academic_works after insert or update on public.academic_works
  for each row execute function public.audit_row();

create or replace function public.academic_work_on_submission()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  update public.academic_works set status='depose'
   where student_document_id = new.student_document_id and status in ('a_deposer','a_corriger');
  return new;
end $$;
drop trigger if exists trg_academic_work_on_submission on public.student_document_submissions;
create trigger trg_academic_work_on_submission after insert on public.student_document_submissions
  for each row execute function public.academic_work_on_submission();

-- 6) RLS (création via RPC → PAS d'INSERT policy ; pas de SELECT direct étudiant)
alter table public.academic_works enable row level security;
drop policy if exists "aw staff read" on public.academic_works;
create policy "aw staff read" on public.academic_works for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
drop policy if exists "aw staff insert" on public.academic_works;        -- supprimée : création via RPC
drop policy if exists "aw staff update draft" on public.academic_works;
create policy "aw staff update draft" on public.academic_works for update
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin') and status='brouillon')
  with check (public.current_user_role() in ('directeur_etudes','admin','super_admin') and status='brouillon');
revoke delete on public.academic_works from anon, authenticated;

-- 7) RPC ÉTUDIANT (lecture restreinte de SES travaux) --------------------------
create or replace function public.student_my_academic_works()
returns table(id uuid, work_type text, title text, status text, academic_year text,
              academic_advisor_name text, student_document_id uuid)
language sql security definer set search_path to 'public' stable as $$
  select id, work_type, title, status, academic_year, academic_advisor_name, student_document_id
  from public.academic_works where student_id = auth.uid() order by created_at desc;
$$;

-- 8) RPC CRÉATION (validations DB ; aucun snapshot/rattachement fabriqué client)
create or replace function public.academic_work_create(
  p_student uuid, p_year text, p_work_type text, p_title text, p_internship uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_title),'') = '' then raise exception 'titre obligatoire'; end if;
  if p_work_type not in ('memoire','rapport_stage','pfe') then raise exception 'type invalide'; end if;
  if (select role from public.profiles where id = p_student) is distinct from 'etudiant'::public.user_role then
    raise exception 'le bénéficiaire doit être un étudiant'; end if;
  if not exists (select 1 from public.academic_years where year = p_year) then raise exception 'année académique invalide'; end if;
  if p_internship is not null and not exists (
      select 1 from public.internships where id = p_internship and student_id = p_student) then
    raise exception 'stage inexistant ou n''appartenant pas à cet étudiant'; end if;
  insert into public.academic_works(student_id, academic_year, work_type, title, internship_id)
  values (p_student, p_year, p_work_type, btrim(p_title), p_internship)
  returning id into v_id;
  return v_id;
end $$;

-- 9) RPC OUVERTURE (idempotente, concurrent-safe : exactement 1 demande doc).
create or replace function public.academic_work_open(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.academic_works; v_doc uuid; v_label text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  select * into r from public.academic_works where id = p_id for update;     -- verrou → concurrence
  if not found then raise exception 'travail introuvable'; end if;
  if r.status = 'a_deposer' and r.student_document_id is not null then return; end if;  -- idempotent
  if r.status <> 'brouillon' then raise exception 'ouverture impossible (statut)'; end if;
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  select label into v_label from public.document_types where doc_key = r.work_type;
  insert into public.student_documents(student_id, label, doc_key, status, requested_by, requested_at)
  values (r.student_id, coalesce(v_label, r.work_type)||' — '||r.title, r.work_type, 'a_fournir', auth.uid(), now())
  returning id into v_doc;
  update public.academic_works set status='a_deposer', student_document_id=v_doc where id=p_id and status='brouillon';
end $$;

-- 10) VALIDATION (SYNC ATOMIQUE : travail valide + dernière version/doc validés).
create or replace function public.academic_work_validate(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_doc uuid; v_sub uuid; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  select student_document_id into v_doc from public.academic_works where id=p_id and status='depose' for update;
  if not found then raise exception 'validation impossible (statut ou concurrence)'; end if;
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  update public.academic_works set status='valide', validated_by=auth.uid(), validated_at=now() where id=p_id and status='depose';
  if v_doc is not null then
    select id into v_sub from public.student_document_submissions where student_document_id=v_doc order by uploaded_at desc limit 1;
    if v_sub is not null then
      update public.student_document_submissions set status='valide', reviewed_by=auth.uid(), reviewed_at=now() where id=v_sub;
    end if;
    update public.student_documents set status='valide' where id=v_doc;
  end if;
end $$;

-- 11) CORRECTION (SYNC ATOMIQUE : travail a_corriger + version refusée + doc re-dépôt).
create or replace function public.academic_work_request_correction(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_doc uuid; v_sub uuid; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  select student_document_id into v_doc from public.academic_works where id=p_id and status='depose' for update;
  if not found then raise exception 'renvoi en correction impossible (statut ou concurrence)'; end if;
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.academic_works set status='a_corriger' where id=p_id and status='depose';
  if v_doc is not null then
    select id into v_sub from public.student_document_submissions where student_document_id=v_doc order by uploaded_at desc limit 1;
    if v_sub is not null then
      update public.student_document_submissions set status='refuse', reviewed_by=auth.uid(), reviewed_at=now(), review_note=p_reason where id=v_sub;
    end if;
    update public.student_documents set status='refuse' where id=v_doc;  -- l'étudiant redépose une nouvelle version
  end if;
end $$;

create or replace function public.academic_work_cancel(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.academic_works set status='annule' where id=p_id and status in ('brouillon','a_deposer','depose','a_corriger');
  get diagnostics v = row_count; if not v then raise exception 'annulation impossible (statut)'; end if;
end $$;

-- 12) ENCADREUR (règle D7 ; motif ; concurrence ; états non terminaux).
create or replace function public.academic_work_assign_advisor(
  p_id uuid, p_advisor uuid, p_expected_advisor uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; v_name text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if not public.is_pedagogically_eligible_teacher(p_advisor) then raise exception 'encadreur non éligible pédagogiquement'; end if;
  select full_name into v_name from public.profiles where id = p_advisor;
  perform set_config('app.academic_work_tx', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.academic_works
     set academic_advisor_id = p_advisor, academic_advisor_name = coalesce(v_name,'(sans nom)')
   where id = p_id and academic_advisor_id is not distinct from p_expected_advisor
     and status in ('brouillon','a_deposer','depose','a_corriger');
  get diagnostics v = row_count;
  if not v then raise exception 'affectation impossible : travail introuvable, fermé, ou encadreur modifié entre-temps (concurrence)'; end if;
end $$;

do $$ declare f text; begin
  for f in select unnest(array[
    'student_my_academic_works()','academic_work_create(uuid,text,text,text,uuid)',
    'academic_work_open(uuid)','academic_work_validate(uuid)',
    'academic_work_request_correction(uuid,text)','academic_work_cancel(uuid,text)',
    'academic_work_assign_advisor(uuid,uuid,uuid,text)'])
  loop
    execute 'revoke execute on function public.'||f||' from public, anon';
    execute 'grant execute on function public.'||f||' to authenticated';
  end loop;
end $$;
