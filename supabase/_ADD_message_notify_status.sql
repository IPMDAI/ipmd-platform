-- ============================================================================
-- Conversation candidat ↔ IPMD — état d'envoi de la notification email
-- ----------------------------------------------------------------------------
-- Quand l'équipe envoie un message, une notification email best-effort part vers
-- le candidat. On trace son résultat pour SIGNALER visuellement un échec :
--   notify_status =
--     'sent'    → email de notification parti ;
--     'failed'  → email tenté mais échoué (Resend KO / rejet) → à réessayer ;
--     'skipped' → pas de notification voulue (pas d'email, envoi désactivé) ;
--     NULL      → non applicable (message du candidat).
-- Additif + idempotent.
-- ============================================================================

alter table public.candidature_messages
  add column if not exists notify_status text;
