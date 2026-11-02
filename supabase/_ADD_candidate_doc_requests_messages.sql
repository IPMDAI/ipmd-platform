-- ============================================================================
-- Candidatures — demande de pièces, dépôt sécurisé sans compte, conversation
-- ----------------------------------------------------------------------------
-- 1) inscription_requests : pièces demandées + signal de dépôt + version de jeton
--    (la version sert à la RÉVOCATION : l'incrémenter invalide tous les anciens liens).
-- 2) candidature_messages : conversation candidat ↔ IPMD rattachée à la candidature,
--    RLS activée SANS policy publique → accès uniquement via service-role côté serveur
--    (candidat : action gated par jeton signé ; équipe : action gated requireAdmin).
-- Additif + idempotent. Aucune donnée académique/finance/auth touchée.
-- ============================================================================

begin;

alter table public.inscription_requests
  add column if not exists requested_docs        text[],
  add column if not exists docs_submitted_at     timestamptz,
  add column if not exists docs_reviewed_at       timestamptz,
  add column if not exists dossier_token_version  integer not null default 1;

create table if not exists public.candidature_messages (
  id             uuid primary key default gen_random_uuid(),
  candidature_id uuid not null references public.inscription_requests(id) on delete cascade,
  sender         text not null check (sender in ('admin', 'candidate')),
  body           text not null,
  author_name    text,
  created_at     timestamptz not null default now(),
  read_at        timestamptz
);

create index if not exists candidature_messages_cand_idx
  on public.candidature_messages(candidature_id, created_at);

alter table public.candidature_messages enable row level security;

commit;
