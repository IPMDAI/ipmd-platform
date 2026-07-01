-- ══════════════════════════════════════════════════════════════
-- IPMD — Activation des documents par l'administration.
-- Un étudiant ne voit un document QUE s'il a été activé ici
-- (en plus d'exiger signature + cachet côté application).
-- À exécuter dans Supabase > SQL Editor. Nécessite current_user_role().
-- ══════════════════════════════════════════════════════════════

create table if not exists public.document_grants (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,            -- attestation-scolarite | certificat-scolarite | attestation-reussite | carte
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_by_name text,
  granted_at timestamptz not null default now(),
  unique (student_id, doc_type)
);

alter table public.document_grants enable row level security;

-- L'étudiant lit SES autorisations (pour savoir quels documents afficher).
drop policy if exists "grants student reads own" on public.document_grants;
create policy "grants student reads own"
  on public.document_grants for select
  to authenticated
  using (student_id = auth.uid());

-- Les admins gèrent tout (lecture + activation/désactivation).
drop policy if exists "grants admins all" on public.document_grants;
create policy "grants admins all"
  on public.document_grants for all
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
