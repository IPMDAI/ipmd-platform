-- P3b — Documents à fournir (checklist + upload parent/étudiant + validation admin).

-- 1) Bucket privé dédié + limites (10 Mo, pdf/jpg/png).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', false, 10485760,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Helper : parent d'un étudiant, comparé en TEXTE (évite tout cast uuid fragile
--    sur le 1er segment du chemin storage {student_id}/...).
create or replace function public.is_parent_of_txt(sid text)
  returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.parent_links
    where parent_id = auth.uid() and student_id::text = sid
  );
$$;

-- 3) Policies storage : accès au fichier = staff OU l'étudiant lui-même OU son parent,
--    selon le 1er dossier du chemin = student_id.
drop policy if exists "Student docs read" on storage.objects;
create policy "Student docs read" on storage.objects for select using (
  bucket_id = 'student-documents' and (
    (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
    or (storage.foldername(name))[1] = auth.uid()::text
    or public.is_parent_of_txt((storage.foldername(name))[1])
  )
);
drop policy if exists "Student docs insert" on storage.objects;
create policy "Student docs insert" on storage.objects for insert with check (
  bucket_id = 'student-documents' and (
    (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
    or (storage.foldername(name))[1] = auth.uid()::text
    or public.is_parent_of_txt((storage.foldername(name))[1])
  )
);
drop policy if exists "Student docs update" on storage.objects;
create policy "Student docs update" on storage.objects for update
  using (
    bucket_id = 'student-documents' and (
      (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_parent_of_txt((storage.foldername(name))[1])
    )
  )
  with check (
    bucket_id = 'student-documents' and (
      (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_parent_of_txt((storage.foldername(name))[1])
    )
  );
drop policy if exists "Student docs delete" on storage.objects;
create policy "Student docs delete" on storage.objects for delete using (
  bucket_id = 'student-documents' and (
    (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
    or (storage.foldername(name))[1] = auth.uid()::text
    or public.is_parent_of_txt((storage.foldername(name))[1])
  )
);

-- 4) Table des documents demandés par étudiant.
create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  doc_key text,
  status text not null default 'a_fournir'
    check (status in ('a_fournir','fourni','valide','refuse')),
  path text,
  note text,
  requested_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  provided_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz
);
create index if not exists student_documents_student_idx on public.student_documents(student_id);

alter table public.student_documents enable row level security;

-- Staff gère tout (ajout, validation/refus).
drop policy if exists "Staff manage student docs" on public.student_documents;
create policy "Staff manage student docs" on public.student_documents for all
  using ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']));

-- Parent : lecture + dépôt (ne peut que passer à 'a_fournir'/'fourni', jamais 'valide').
drop policy if exists "Parent reads child docs" on public.student_documents;
create policy "Parent reads child docs" on public.student_documents for select
  using (public.is_parent_of(student_id));
drop policy if exists "Parent provides child docs" on public.student_documents;
create policy "Parent provides child docs" on public.student_documents for update
  using (public.is_parent_of(student_id))
  with check (public.is_parent_of(student_id) and status in ('a_fournir','fourni'));

-- Étudiant : lecture + dépôt de ses propres documents.
drop policy if exists "Student reads own docs" on public.student_documents;
create policy "Student reads own docs" on public.student_documents for select
  using (student_id = auth.uid());
drop policy if exists "Student provides own docs" on public.student_documents;
create policy "Student provides own docs" on public.student_documents for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status in ('a_fournir','fourni'));
