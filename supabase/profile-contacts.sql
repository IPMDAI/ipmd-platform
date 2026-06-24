-- ──────────────────────────────────────────────────────────────
-- IPMD — Coordonnées des profils (étudiants & enseignants) :
-- téléphone, WhatsApp, email personnel, email IPMD attribué.
-- (profiles.email reste l'email de connexion / compte.)
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists personal_email text;
alter table public.profiles add column if not exists school_email text;
