-- ──────────────────────────────────────────────────────────────
-- IPMD — Lien parent ↔ enfant : préciser le rôle (Père / Mère / Tuteur).
-- À exécuter dans Supabase > SQL Editor. 1 colonne.
-- ──────────────────────────────────────────────────────────────

alter table public.parent_links add column if not exists relationship text;
