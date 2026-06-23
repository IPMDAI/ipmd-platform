-- ──────────────────────────────────────────────────────────────
-- IPMD — Bulletin officiel : UE + ECTS sur les cours + état civil
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- ──────────────────────────────────────────────────────────────

-- Unité d'enseignement (UE) + crédits ECTS par cours (élément constitutif).
alter table public.courses add column if not exists ue_number int;
alter table public.courses add column if not exists ue_name text;
alter table public.courses add column if not exists ects numeric(4, 1) not null default 0;

-- État civil de l'étudiant (en-tête du bulletin officiel).
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists birth_place text;
