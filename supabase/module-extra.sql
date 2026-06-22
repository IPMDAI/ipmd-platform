-- ──────────────────────────────────────────────────────────────
-- IPMD — Module : objectifs, compétences, modalités + fichiers
-- À exécuter dans Supabase > SQL Editor APRÈS module-details.sql.
-- ──────────────────────────────────────────────────────────────

-- Champs pédagogiques.
alter table public.modules add column if not exists objectives text;
alter table public.modules add column if not exists skills text;
alter table public.modules add column if not exists evaluation_methods text;

-- Bucket de stockage pour les supports (PDF, PowerPoint…).
insert into storage.buckets (id, name, public)
values ('module-supports', 'module-supports', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers ; envoi/suppression réservés aux admins.
drop policy if exists "Public read supports files" on storage.objects;
create policy "Public read supports files" on storage.objects for select to public
  using (bucket_id = 'module-supports');

drop policy if exists "Admins upload supports files" on storage.objects;
create policy "Admins upload supports files" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'module-supports'
    and public.current_user_role() in ('super_admin', 'admin')
  );

drop policy if exists "Admins delete supports files" on storage.objects;
create policy "Admins delete supports files" on storage.objects for delete to authenticated
  using (
    bucket_id = 'module-supports'
    and public.current_user_role() in ('super_admin', 'admin')
  );
