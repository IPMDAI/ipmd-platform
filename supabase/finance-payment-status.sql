-- ──────────────────────────────────────────────────────────────
-- IPMD — Finance : statut d'un paiement (journal des paiements).
-- payé | en_attente (de vérification) | annule
-- À exécuter dans Supabase > SQL Editor. 1 colonne.
-- ──────────────────────────────────────────────────────────────

alter table public.payments add column if not exists status text not null default 'paye';
