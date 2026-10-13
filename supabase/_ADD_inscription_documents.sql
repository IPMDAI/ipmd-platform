-- ══════════════════════════════════════════════════════════════
-- IPMD — Persistance générique des pièces de candidature (wizard).
-- Table `inscription_documents` : 1 ligne par fichier téléversé.
-- Data-driven : `doc_key` référence document_types ; `requirement` est un
-- SNAPSHOT (au moment du dépôt) de l'exigence du profil documentaire.
--
-- ⚠️ Les colonnes legacy doc_* de inscription_requests restent INTACTES
-- (compatibilité de l'admin actuel). Cette table les complète, ne les remplace pas.
--
-- Écritures : via la future RPC de submit (SECURITY DEFINER, atomique) — pas de
-- policy INSERT publique ici. Lecture : administration uniquement.
-- ══════════════════════════════════════════════════════════════

begin;

create table if not exists public.inscription_documents (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.inscription_requests(id) on delete restrict,
  doc_key      text not null references public.document_types(doc_key),
  path         text not null,
  requirement  text not null check (requirement in ('required','optional','conditional')),
  created_at   timestamptz not null default now(),
  -- Évite les doublons EXACTS ; autorise plusieurs fichiers pour un même doc_key
  -- (ex. bulletins) tant que le chemin diffère.
  constraint inscription_documents_unique unique (request_id, doc_key, path)
);

create index if not exists inscription_documents_request_idx
  on public.inscription_documents (request_id);

alter table public.inscription_documents enable row level security;

-- Lecture réservée à l'administration (même pattern que inscription_requests).
drop policy if exists "Admins read inscription_documents" on public.inscription_documents;
create policy "Admins read inscription_documents" on public.inscription_documents
  for select to authenticated
  using (current_user_role() = any (array['super_admin'::user_role, 'admin'::user_role]));

-- Aucune policy INSERT/UPDATE/DELETE publique : les écritures passeront par la
-- RPC de submit (SECURITY DEFINER) qui contourne la RLS de façon contrôlée et
-- insère request + documents dans une seule transaction.

commit;
