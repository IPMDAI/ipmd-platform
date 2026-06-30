-- ══════════════════════════════════════════════════════════════
-- IPMD — Date & lieu de naissance dans les demandes d'admission.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

alter table public.inscription_requests
  add column if not exists birth_date date,
  add column if not exists birth_place text;
