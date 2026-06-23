-- ──────────────────────────────────────────────────────────────
-- IPMD — Pièces jointes des candidatures (Storage privé)
-- Bucket privé + colonnes de chemins sur inscription_requests.
-- Upload via service-role ; lecture admin via URLs signées.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('candidature-docs', 'candidature-docs', false)
on conflict (id) do nothing;

alter table public.inscription_requests add column if not exists doc_diploma text;
alter table public.inscription_requests add column if not exists doc_bulletins text;
alter table public.inscription_requests add column if not exists doc_id text;
alter table public.inscription_requests add column if not exists doc_attestation text;
