-- P6a — Vie IPMD : événements + RSVP.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'autre'
    check (kind in ('jpo','conference','ceremonie','panel','networking','autre')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  audience text not null default 'all' check (audience in ('all','parent','etudiant')),
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events(starts_at);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  response text not null check (response in ('oui','non','peut_etre')),
  responded_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_rsvps_event_idx on public.event_rsvps(event_id);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Staff gère les événements.
drop policy if exists "Staff manage events" on public.events;
create policy "Staff manage events" on public.events for all
  using ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']));

-- Les destinataires lisent les événements PUBLIÉS selon l'audience.
drop policy if exists "Read published events" on public.events;
create policy "Read published events" on public.events for select using (
  published
  and (
    audience = 'all'
    or (audience = 'parent' and (current_user_role())::text = 'parent')
    or (audience = 'etudiant'
        and (current_user_role())::text = any (array['etudiant','professionnel','dirigeant']))
  )
);

-- RSVP : chacun gère le sien, pour un événement qu'il peut voir.
drop policy if exists "Own rsvp select" on public.event_rsvps;
create policy "Own rsvp select" on public.event_rsvps for select using (user_id = auth.uid());
drop policy if exists "Own rsvp insert" on public.event_rsvps;
create policy "Own rsvp insert" on public.event_rsvps for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.events e where e.id = event_id and e.published)
  );
drop policy if exists "Own rsvp update" on public.event_rsvps;
create policy "Own rsvp update" on public.event_rsvps for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Staff lit tous les RSVP (compteurs).
drop policy if exists "Staff read rsvps" on public.event_rsvps;
create policy "Staff read rsvps" on public.event_rsvps for select using (
  (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
);
