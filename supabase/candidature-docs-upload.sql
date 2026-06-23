-- ──────────────────────────────────────────────────────────────
-- IPMD — Autoriser le dépôt des pièces depuis le formulaire public
-- Upload direct (navigateur) vers le bucket privé candidature-docs.
-- La LECTURE reste réservée (admins via URLs signées service-role).
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

drop policy if exists "Public can upload candidature docs" on storage.objects;
create policy "Public can upload candidature docs" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'candidature-docs');
