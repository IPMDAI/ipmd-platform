-- ══════════════════════════════════════════════════════════════
-- IPMD — Module Marketing / Prospects (CRM admissions).
-- Prospects (demandes d'info) + journal des contacts.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  program_interest text,
  level_interest text,
  format text,                       -- jour | soir | pro
  source text default 'manuel',      -- site | manuel | whatsapp | email | salon
  message text,
  status text not null default 'nouveau', -- nouveau | contacte | relance | candidature | inscrit | perdu
  note text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_status_idx on public.prospects (status);

create table if not exists public.prospect_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  type text not null,                -- email | whatsapp | note | statut
  detail text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);
create index if not exists prospect_events_prospect_idx on public.prospect_events (prospect_id);

alter table public.prospects enable row level security;
alter table public.prospect_events enable row level security;

-- Le public (site) peut SOUMETTRE une demande d'info (mais pas lire).
drop policy if exists "Public submits prospect" on public.prospects;
create policy "Public submits prospect" on public.prospects for insert to anon, authenticated
  with check (true);

-- L'administration (admissions) gère les prospects.
drop policy if exists "Staff manage prospects" on public.prospects;
create policy "Staff manage prospects" on public.prospects for all to authenticated
  using (public.current_user_role() in ('super_admin','admin','scolarite'))
  with check (public.current_user_role() in ('super_admin','admin','scolarite'));

drop policy if exists "Staff manage prospect events" on public.prospect_events;
create policy "Staff manage prospect events" on public.prospect_events for all to authenticated
  using (public.current_user_role() in ('super_admin','admin','scolarite'))
  with check (public.current_user_role() in ('super_admin','admin','scolarite'));
