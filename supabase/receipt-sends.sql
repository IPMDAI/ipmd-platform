-- ──────────────────────────────────────────────────────────────
-- IPMD — Finance : historique d'envoi des reçus de paiement.
-- Qui a reçu le reçu, par quel canal (email / WhatsApp), quand.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.receipt_sends (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  recipient text not null,          -- « Étudiant », « Parent : Nom », …
  channel text not null,            -- 'email' | 'whatsapp'
  sent_at timestamptz not null default now(),
  sent_by uuid references public.profiles (id)
);

create index if not exists receipt_sends_payment_idx on public.receipt_sends (payment_id);

alter table public.receipt_sends enable row level security;

drop policy if exists "Staff manage receipt sends" on public.receipt_sends;
create policy "Staff manage receipt sends" on public.receipt_sends for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role() in ('super_admin', 'admin', 'scolarite'));
