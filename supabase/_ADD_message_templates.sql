-- ============================================================================
-- Modèles de messages personnalisables (équipe)
-- ----------------------------------------------------------------------------
-- Modèles partagés (créés/édités par l'équipe), en plus des modèles intégrés.
-- Variables {prenom} / {programme} remplies à l'insertion dans le composer.
-- RLS activée SANS policy publique → accès service-role côté serveur (actions admin).
-- Additif + idempotent.
-- ============================================================================

create table if not exists public.message_templates (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.message_templates enable row level security;
