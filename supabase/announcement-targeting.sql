-- ──────────────────────────────────────────────────────────────
-- IPMD — Ciblage des annonces (filière / niveau / univers)
-- À exécuter dans Supabase > SQL Editor APRÈS announcements.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.announcements
  add column if not exists target_type text not null default 'all'; -- all | filiere | niveau | univers
alter table public.announcements
  add column if not exists target_value text;
