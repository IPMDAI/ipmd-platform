-- ══════════════════════════════════════════════════════════════
-- IPMD — Signataire retenu par document activé.
-- Permet à l'admin de choisir QUI signe (Dir. Études, Resp. pédago,
-- Admin Général…) ; la disponibilité dépend de CE signataire.
-- À exécuter dans Supabase > SQL Editor (après _ADD_document_grants.sql).
-- ══════════════════════════════════════════════════════════════

alter table public.document_grants
  add column if not exists signatory text;
