-- ══════════════════════════════════════════════════════════════
-- IPMD — Phase 2 : identité internationale (candidatures).
-- PROPOSITION — non appliquée. Ajoute 3 colonnes ISO-2 pays à
-- inscription_requests. Réutilise birth_date / birth_place / phone / whatsapp /
-- mode (déjà présents). Non destructif : colonnes nullables, lignes legacy = NULL.
--
--  - birth_country     : pays de naissance (ISO-2, ex. 'CI')
--  - phone_country     : pays de l'indicatif téléphone (ISO-2) ; le numéro reste
--                        stocké en E.164 dans `phone` (indicatif inclus)
--  - whatsapp_country  : pays de l'indicatif WhatsApp (ISO-2) ; numéro E.164 dans `whatsapp`
-- ══════════════════════════════════════════════════════════════

begin;

alter table public.inscription_requests
  add column if not exists birth_country    text,
  add column if not exists phone_country    text,
  add column if not exists whatsapp_country text;

commit;
