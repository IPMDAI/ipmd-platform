-- ──────────────────────────────────────────────────────────────
-- IPMD — Suppression de « AFRICA BEST » (entreprise importée par erreur).
-- La suppression du compte auth retire en cascade : profil, finance,
-- paiements, affectation de classe. À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

delete from auth.users where email = 'africabestsarl@gmail.com';
