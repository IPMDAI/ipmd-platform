-- ──────────────────────────────────────────────────────────────
-- IPMD — Réseau social interne : amis + messages privés
-- À exécuter dans Supabase > SQL Editor.
-- ⚠️ Ouvre la lecture des profils (annuaire) à tous les membres connectés.
-- ──────────────────────────────────────────────────────────────

-- Annuaire : un membre connecté peut voir les autres membres.
drop policy if exists "Authenticated read members" on public.profiles;
create policy "Authenticated read members" on public.profiles
  for select to authenticated using (true);

-- ── Amitiés ────────────────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending', -- pending | accepted
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;

drop policy if exists "Read own friendships" on public.friendships;
create policy "Read own friendships" on public.friendships
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "Send friend request" on public.friendships;
create policy "Send friend request" on public.friendships
  for insert to authenticated
  with check (requester_id = auth.uid());

drop policy if exists "Respond friend request" on public.friendships;
create policy "Respond friend request" on public.friendships
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

drop policy if exists "Delete friendship" on public.friendships;
create policy "Delete friendship" on public.friendships
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Sont-ils amis ? (SECURITY DEFINER pour éviter la récursion RLS)
create or replace function public.are_friends(other uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = other)
        or (f.requester_id = other and f.addressee_id = auth.uid()))
  );
$$;

-- ── Messages privés ────────────────────────────────────────────
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.direct_messages enable row level security;

drop policy if exists "Read own DMs" on public.direct_messages;
create policy "Read own DMs" on public.direct_messages
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- On ne peut écrire qu'à un ami accepté.
drop policy if exists "Send DM to friend" on public.direct_messages;
create policy "Send DM to friend" on public.direct_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.are_friends(recipient_id));

drop policy if exists "Mark DM read" on public.direct_messages;
create policy "Mark DM read" on public.direct_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
