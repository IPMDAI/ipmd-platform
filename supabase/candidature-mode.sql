-- ══════════════════════════════════════════════════════════════
-- IPMD — Mode souhaité par le candidat (formulaire bootcamp).
-- presentiel | distance | hybride.
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- ══════════════════════════════════════════════════════════════

alter table public.inscription_requests
  add column if not exists mode text;
