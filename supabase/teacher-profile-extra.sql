-- ──────────────────────────────────────────────────────────────
-- IPMD — Fiche enseignant : champs complémentaires (contrat à 100%)
-- À exécuter dans Supabase > SQL Editor APRÈS teacher-profiles.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.teacher_profiles add column if not exists civilite text;
alter table public.teacher_profiles add column if not exists prenoms text;
alter table public.teacher_profiles add column if not exists type_piece text;
alter table public.teacher_profiles add column if not exists num_piece text;
alter table public.teacher_profiles add column if not exists nationalite text;
alter table public.teacher_profiles add column if not exists date_naissance date;
alter table public.teacher_profiles add column if not exists situation_matrimoniale text;
alter table public.teacher_profiles add column if not exists pays_residence text;
alter table public.teacher_profiles add column if not exists ville_residence text;
alter table public.teacher_profiles add column if not exists diploma_date date;
alter table public.teacher_profiles add column if not exists diploma_school text;
alter table public.teacher_profiles add column if not exists emergency_name text;
alter table public.teacher_profiles add column if not exists emergency_phone text;
