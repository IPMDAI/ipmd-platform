-- ══════════════════════════════════════════════════════════════
-- IPMD — Univers visé par un prospect (Marketing).
-- Permet de séparer Diplômes / Bootcamps et par univers.
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- ══════════════════════════════════════════════════════════════

alter table public.prospects
  add column if not exists universe text;

create index if not exists prospects_universe_idx on public.prospects (universe);
