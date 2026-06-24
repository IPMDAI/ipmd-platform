-- ──────────────────────────────────────────────────────────────
-- IPMD — Fiche de suivi pédagogique : champ « Travaux demandés (écrit/oral) ».
-- Aligne la fiche de séance sur le format officiel SUIVI PÉDAGOGIQUE.
-- À exécuter dans Supabase > SQL Editor. 1 colonne.
-- ──────────────────────────────────────────────────────────────

alter table public.session_reports add column if not exists homework text;
