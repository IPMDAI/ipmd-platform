-- ============================================================================
-- Candidatures — rappel de relance
-- ----------------------------------------------------------------------------
-- follow_up_at : date/heure de relance prévue (null = aucune) → onglet « À relancer »
--   (follow_up_at <= now). follow_up_note : ce qu'il faut faire. Additif + idempotent.
-- Aucune donnée académique/finance/auth touchée.
-- ============================================================================

alter table public.inscription_requests
  add column if not exists follow_up_at   timestamptz,
  add column if not exists follow_up_note text;
