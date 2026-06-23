-- ──────────────────────────────────────────────────────────────
-- IPMD — Numéro WhatsApp (facultatif) sur les demandes d'inscription
-- À exécuter dans Supabase > SQL Editor. 1 colonne.
-- ──────────────────────────────────────────────────────────────

alter table public.inscription_requests add column if not exists whatsapp text;
