-- P3b (correctif) — Historique des soumissions, jamais d'écrasement.
-- student_documents = LA DEMANDE (état courant synchronisé) ;
-- student_document_submissions = chaque VERSION déposée (conservée à vie).

-- 1) student_documents ne porte plus les infos par-version (elles passent aux soumissions).
alter table public.student_documents drop column if exists path;
alter table public.student_documents drop column if exists note;
alter table public.student_documents drop column if exists provided_at;
alter table public.student_documents drop column if exists reviewed_by;
alter table public.student_documents drop column if exists reviewed_at;
-- Conserve : id, student_id, label, doc_key, status (état courant), requested_by, requested_at.

-- 2) Table des soumissions (versions).
create table if not exists public.student_document_submissions (
  id uuid primary key default gen_random_uuid(),
  student_document_id uuid not null references public.student_documents(id) on delete cascade,
  path text not null,
  original_name text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'fourni' check (status in ('fourni','valide','refuse')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text
);
create index if not exists student_doc_subs_doc_idx
  on public.student_document_submissions(student_document_id);

alter table public.student_document_submissions enable row level security;

-- Staff gère tout (lecture + validation/refus).
drop policy if exists "Staff manage submissions" on public.student_document_submissions;
create policy "Staff manage submissions" on public.student_document_submissions for all
  using ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']));

-- Parent / étudiant : lecture des soumissions de leurs documents.
drop policy if exists "Recipient reads submissions" on public.student_document_submissions;
create policy "Recipient reads submissions" on public.student_document_submissions for select
  using (exists (
    select 1 from public.student_documents d
    where d.id = student_document_id
      and (public.is_parent_of(d.student_id) or d.student_id = auth.uid())
  ));

-- Parent / étudiant : DÉPÔT d'une nouvelle version (status 'fourni' uniquement,
-- par soi-même). Pas d'update/delete → les anciennes versions sont immuables pour eux.
drop policy if exists "Recipient adds submission" on public.student_document_submissions;
create policy "Recipient adds submission" on public.student_document_submissions for insert
  with check (
    uploaded_by = auth.uid()
    and status = 'fourni'
    and exists (
      select 1 from public.student_documents d
      where d.id = student_document_id
        and (public.is_parent_of(d.student_id) or d.student_id = auth.uid())
    )
  );

-- 3) Storage : empêcher parent/étudiant d'écraser ou supprimer une version.
--    (chemins uniques {student_id}/{doc_id}/{submission_id}.ext → pas d'upsert utile.)
drop policy if exists "Student docs update" on storage.objects;
create policy "Student docs update" on storage.objects for update
  using (
    bucket_id = 'student-documents'
    and (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
  )
  with check (
    bucket_id = 'student-documents'
    and (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
  );
drop policy if exists "Student docs delete" on storage.objects;
create policy "Student docs delete" on storage.objects for delete using (
  bucket_id = 'student-documents'
  and (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
);
-- (Les policies read/insert restent : staff OU étudiant OU parent.)
