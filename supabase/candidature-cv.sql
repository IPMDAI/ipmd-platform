-- ══════════════════════════════════════════════════════════════
-- IPMD — Ajout du CV aux demandes (formulaire bootcamp).
-- La pièce d'identité réutilise la colonne existante doc_id.
-- À exécuter une fois dans Supabase (SQL Editor).
-- ══════════════════════════════════════════════════════════════

alter table public.inscription_requests
  add column if not exists doc_cv text;
