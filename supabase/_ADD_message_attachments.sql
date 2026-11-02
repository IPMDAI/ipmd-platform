-- ============================================================================
-- Conversation candidat ↔ IPMD — pièces jointes
-- ----------------------------------------------------------------------------
-- Un message peut porter UN fichier (bucket privé candidature-docs) :
--   attachment_path = chemin stockage, attachment_name = nom d'origine affiché.
-- La prévisualisation se fait via URL signée générée côté serveur (service-role).
-- Additif + idempotent.
-- ============================================================================

alter table public.candidature_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text;
