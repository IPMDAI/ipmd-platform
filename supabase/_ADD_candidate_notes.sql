-- ============================================================================
-- Candidatures — notes internes (réservées à l'équipe)
-- ----------------------------------------------------------------------------
-- Table SÉPARÉE (jamais lue par le lien candidat → zéro fuite possible). RLS activée
-- SANS policy publique : accès uniquement via service-role côté serveur (actions
-- gated requireAdmin). Additif + idempotent.
-- ============================================================================

create table if not exists public.candidature_notes (
  id             uuid primary key default gen_random_uuid(),
  candidature_id uuid not null references public.inscription_requests(id) on delete cascade,
  body           text not null,
  author_name    text,
  created_at     timestamptz not null default now()
);

create index if not exists candidature_notes_cand_idx
  on public.candidature_notes(candidature_id, created_at);

alter table public.candidature_notes enable row level security;
