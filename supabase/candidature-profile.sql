-- ──────────────────────────────────────────────────────────────
-- IPMD — Profil souhaité sur la candidature
-- Permet de pré-remplir le rôle au moment de l'invitation.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

alter table public.inscription_requests
  add column if not exists desired_role text;
