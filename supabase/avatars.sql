-- ──────────────────────────────────────────────────────────────
-- IPMD — Photos de profil (avatars). Bucket PUBLIC en lecture,
-- chaque utilisateur gère son propre dossier (avatars/<user_id>/…).
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Lecture publique (les photos s'affichent partout).
drop policy if exists "Avatars public read" on storage.objects;
create policy "Avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

-- Chaque utilisateur téléverse / met à jour / supprime SON dossier.
drop policy if exists "Avatars user upload" on storage.objects;
create policy "Avatars user upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatars user update" on storage.objects;
create policy "Avatars user update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatars user delete" on storage.objects;
create policy "Avatars user delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
