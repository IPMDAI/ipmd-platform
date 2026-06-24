-- ──────────────────────────────────────────────────────────────
-- IPMD — Finance : profil payeur / commentaire de suivi par étudiant.
-- À exécuter dans Supabase > SQL Editor. 1 colonne.
-- ──────────────────────────────────────────────────────────────

alter table public.student_finance add column if not exists payer_note text;
