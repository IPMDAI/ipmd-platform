-- ─────────────────────────────────────────────────────────────────────────
-- Journal des emails de confirmation d'acceptation du règlement intérieur.
-- Conserve une COPIE de chaque email + son STATUT d'envoi, consultable par l'IPMD
-- (admin/super_admin). L'échec est visible et peut être RELANCÉ sans créer de
-- seconde acceptation ni de doublon (dédup par dedup_key unique).
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.reglement_emails (
  id                  uuid primary key default gen_random_uuid(),
  -- Clé de déduplication : 'pack:{pack_id}:{version}' ou 'user:{user_id}:{version}'.
  -- Une acceptation d'une version = au plus UN email (relance = même ligne).
  dedup_key           text not null unique,
  scope               text not null check (scope in ('pack', 'espace')),
  candidature_id      uuid references public.inscription_requests(id) on delete set null,
  user_id             uuid,
  recipient           text not null,
  parcours            text not null check (parcours in ('diplome', 'bootcamp')),
  version             text not null,
  subject             text not null,
  html                text not null,          -- copie intégrale de l'email
  status              text not null default 'pending'
                        check (status in ('pending', 'sent', 'failed', 'skipped')),
  error               text,
  provider_message_id text,
  attempts            int  not null default 0,
  created_at          timestamptz not null default now(),
  last_attempt_at     timestamptz,
  sent_at             timestamptz
);

create index if not exists reglement_emails_status_idx on public.reglement_emails (status, created_at desc);

alter table public.reglement_emails enable row level security;

-- Lecture réservée à l'administration (l'écriture passe par le service-role).
drop policy if exists reglement_emails_admin_read on public.reglement_emails;
create policy reglement_emails_admin_read on public.reglement_emails
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );
