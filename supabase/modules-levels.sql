-- ──────────────────────────────────────────────────────────────
-- IPMD — Modules par filière + NIVEAU + SEMESTRE (logique LMD)
-- À exécuter dans Supabase > SQL Editor APRÈS modules.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.modules add column if not exists level text;
alter table public.modules add column if not exists semester text;
