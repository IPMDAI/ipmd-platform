-- ──────────────────────────────────────────────────────────────
-- IPMD — Contrat enseignant (lien du contrat sur la candidature)
-- À exécuter dans Supabase > SQL Editor APRÈS recruitment.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.teacher_applications
  add column if not exists contract_url text;
