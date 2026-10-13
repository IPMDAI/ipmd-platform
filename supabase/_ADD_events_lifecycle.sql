-- P6a (complément) — cycle de vie, capacité/limite, invitations ciblées.

-- 1) Cycle de vie : brouillon / publie / annule.
alter table public.events
  add column if not exists status text not null default 'brouillon'
    check (status in ('brouillon','publie','annule'));

-- 2) Limite d'inscription + capacité (nullables).
alter table public.events add column if not exists registration_deadline timestamptz;
alter table public.events add column if not exists capacity integer;

-- 3) Migration published -> status, puis suppression de la colonne (après les policies
--    qui en dependent).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name='events' and column_name='published') then
    update public.events set status = case when published then 'publie' else 'brouillon' end;
    drop policy if exists "Read published events" on public.events;
    drop policy if exists "Own rsvp insert" on public.event_rsvps;
    alter table public.events drop column published;
  end if;
end $$;

-- 4) Invitations ciblées.
create table if not exists public.event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_invitations_event_idx on public.event_invitations(event_id);
create index if not exists event_invitations_user_idx on public.event_invitations(user_id);

alter table public.event_invitations enable row level security;
drop policy if exists "Staff manage invitations" on public.event_invitations;
create policy "Staff manage invitations" on public.event_invitations for all
  using ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']));
drop policy if exists "Read own invitations" on public.event_invitations;
create policy "Read own invitations" on public.event_invitations for select
  using (user_id = auth.uid());

-- 5) Compteur de confirmations (SECURITY DEFINER) : places restantes / complet
--    sans exposer les RSVP des autres.
create or replace function public.event_oui_count(p_event uuid)
  returns integer language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from public.event_rsvps where event_id = p_event and response = 'oui';
$$;
grant execute on function public.event_oui_count(uuid) to authenticated;

-- 6) Lecture : publiés OU annulés (pour afficher « Annulé »), par audience OU invitation.
drop policy if exists "Read events" on public.events;
create policy "Read events" on public.events for select using (
  status in ('publie','annule')
  and (
    audience = 'all'
    or (audience = 'parent' and (current_user_role())::text = 'parent')
    or (audience = 'etudiant'
        and (current_user_role())::text = any (array['etudiant','professionnel','dirigeant']))
    or exists (
      select 1 from public.event_invitations i
      where i.event_id = events.id and i.user_id = auth.uid()
    )
  )
);

-- 7) RSVP possible uniquement si publié ET avant la date limite.
drop policy if exists "Own rsvp insert" on public.event_rsvps;
create policy "Own rsvp insert" on public.event_rsvps for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'publie'
      and (e.registration_deadline is null or e.registration_deadline > now())
  )
);
