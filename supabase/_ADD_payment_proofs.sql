-- =============================================================================
-- Lot Wave W1 — fondation `payment_proofs` (preuve de paiement candidat)
-- -----------------------------------------------------------------------------
-- PRINCIPE : preuve envoyée ≠ paiement reçu ≠ paiement validé.
-- Une preuve NE DOIT JAMAIS, à elle seule, modifier student_finance /
-- access_state / payment_schedules / statut candidature ni créer un payment.
-- Rattachée à la CANDIDATURE (utilisable AVANT `inscrit` / avant compte).
-- Validation/rejet = action admin (W3) ; enregistrement du paiement = W4.
-- =============================================================================

create table if not exists public.payment_proofs (
  id              uuid primary key default gen_random_uuid(),
  candidature_id  uuid not null references public.inscription_requests(id) on delete cascade,
  pack_id         uuid references public.admission_packs(id) on delete set null,
  kind            text not null default 'inscription' check (kind in ('inscription', 'scolarite')),
  method          text,
  amount_declared numeric not null check (amount_declared > 0),
  reference       text,
  file_path       text,
  status          text not null default 'a_verifier' check (status in ('a_verifier', 'valide', 'rejete')),
  submitted_at    timestamptz not null default now(),
  reviewed_by     uuid references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,
  payment_id      uuid references public.payments(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- GARDE-FOU : une seule preuve `a_verifier` active à la fois par (candidature, kind).
-- Les preuves rejete/valide restent dans l'historique (index partiel).
create unique index if not exists payment_proofs_one_pending
  on public.payment_proofs (candidature_id, kind)
  where status = 'a_verifier';

create index if not exists payment_proofs_candidature_idx
  on public.payment_proofs (candidature_id, created_at desc);

-- RLS : lecture/écriture/review réservées à l'administration.
-- L'écriture CANDIDAT (W2) passera par une action serveur service-role (bypass
-- RLS) ; aucun accès direct candidat (anon/authenticated) n'est ouvert ici.
alter table public.payment_proofs enable row level security;

drop policy if exists "payment_proofs admin read" on public.payment_proofs;
create policy "payment_proofs admin read" on public.payment_proofs
  for select using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "payment_proofs admin insert" on public.payment_proofs;
create policy "payment_proofs admin insert" on public.payment_proofs
  for insert with check (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "payment_proofs admin update" on public.payment_proofs;
create policy "payment_proofs admin update" on public.payment_proofs
  for update
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
