-- ──────────────────────────────────────────────────────────────
-- IPMD — Lot A : refonte du pipeline de candidature (machine à états)
-- À exécuter dans Supabase > SQL Editor.
--
-- 100 % ADDITIF & IDEMPOTENT : n'ajoute que des colonnes NULL par défaut,
-- ne modifie/supprime AUCUNE donnée existante. Sans danger pour les
-- candidatures en cours (elles restent valides : les 4 anciens statuts
-- sont un sous-ensemble des 8 nouveaux).
--
-- Rappel : le champ `status` est un simple `text` SANS contrainte CHECK,
-- donc les 8 statuts (nouveau/en_etude/pieces_a_completer/entretien/
-- accepte/refuse/en_attente_paiement/inscrit) sont validés côté application
-- (src/lib/candidatures.ts) — aucune contrainte SQL à modifier.
--
-- La policy RLS « Admins update inscription_requests » (candidatures-status.sql)
-- couvre déjà ces nouvelles colonnes (RLS = par ligne). Rien à changer côté RLS.
-- ──────────────────────────────────────────────────────────────

-- Décision interne (accepté/refusé) : qui a décidé, et quand.
alter table public.inscription_requests
  add column if not exists decided_at timestamptz;
alter table public.inscription_requests
  add column if not exists decided_by uuid;   -- profiles.id de l'admin décideur

-- Envoi officiel (séparé de la décision) : horodatage des lettres.
alter table public.inscription_requests
  add column if not exists admission_sent_at timestamptz;  -- lettre d'admission envoyée
alter table public.inscription_requests
  add column if not exists refusal_sent_at timestamptz;    -- lettre de refus envoyée

-- Motif de refus (servira à la lettre de refus — Lot C).
alter table public.inscription_requests
  add column if not exists refusal_reason text;

-- NB :
--  • decided_at IS NULL sur une candidature accepte/refuse ⇒ « historique »
--    (décidée avant la refonte) ⇒ avertissement avant tout envoi officiel.
--  • en_attente_paiement n'est atteint que via l'action « Confirmer l'admission ».
--  • inscrit reste posé uniquement par « Créer & inviter ».
