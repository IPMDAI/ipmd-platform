-- ──────────────────────────────────────────────────────────────
-- IPMD — Notes typées : note de classe / examen + coefficient
-- À exécuter dans Supabase > SQL Editor APRÈS grades.sql.
-- (Idempotent : ajoute les colonnes si elles n'existent pas.)
-- ──────────────────────────────────────────────────────────────

alter table public.grades
  add column if not exists type text not null default 'classe';

alter table public.grades
  add column if not exists coefficient numeric(4, 1) not null default 1;
