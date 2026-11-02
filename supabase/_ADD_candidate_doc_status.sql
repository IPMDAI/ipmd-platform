-- ============================================================================
-- Candidatures — récapitulatif des pièces (statut par document)
-- ----------------------------------------------------------------------------
-- Statut par pièce stocké dans un JSONB sur inscription_requests :
--   { "cv": {"status":"validee","reason":null,"at":"…","by":"…"}, … }
-- status ∈ recue | a_verifier | validee | a_remplacer. Métadonnée À CÔTÉ du fichier :
-- changer un statut (même « à remplacer ») ne supprime ni n'écrase jamais doc_*.
-- Additif + idempotent. Aucune donnée académique/finance/auth touchée.
-- ============================================================================

alter table public.inscription_requests
  add column if not exists doc_status jsonb not null default '{}'::jsonb;
