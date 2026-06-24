-- ──────────────────────────────────────────────────────────────
-- IPMD — Classe = cohorte : rentrée, type de public, calendrier,
-- régime de paiement, tarif spécifique (Pro/Partenaire).
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- ──────────────────────────────────────────────────────────────

alter table public.classes add column if not exists intake text;          -- ex. « Octobre 2025 »
alter table public.classes add column if not exists class_type text;       -- initial | pro | partenaire
alter table public.classes add column if not exists partner_name text;     -- si partenaire
alter table public.classes add column if not exists start_date date;       -- début de la cohorte
alter table public.classes add column if not exists end_date date;         -- fin prévue
alter table public.classes add column if not exists payment_regime text;   -- régime de paiement
alter table public.classes add column if not exists tuition_amount numeric(12, 2); -- tarif spécifique (sinon tarif du niveau)
