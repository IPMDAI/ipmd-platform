-- ──────────────────────────────────────────────────────────────
-- IPMD — Univers de formation sur le profil
-- Stocke l'univers (campus, professionnel, gouvernance, ultra…) de chaque
-- apprenant pour l'afficher (carte, bulletin) et l'agréger (statistiques).
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists universe text;
