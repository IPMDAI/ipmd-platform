-- ──────────────────────────────────────────────────────────────
-- IPMD — Schéma Supabase initial
-- À exécuter dans l'éditeur SQL Supabase (Dashboard > SQL Editor).
-- Couvre : demandes d'inscription, messages de contact, profils & rôles.
-- ──────────────────────────────────────────────────────────────

-- Rôles applicatifs (alignés sur le type UserRole côté front).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'super_admin', 'admin', 'enseignant',
      'etudiant', 'parent', 'professionnel', 'dirigeant'
    );
  end if;
end $$;

-- ── Demandes d'inscription (formulaire Admission) ──────────────
create table if not exists public.inscription_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  universe text not null,
  program_interest text,
  entry_level text,
  message text,
  created_at timestamptz not null default now()
);

-- ── Messages de contact (formulaire Contact) ───────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

-- ── Profils utilisateurs (liés à auth.users) ───────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'etudiant',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────
alter table public.inscription_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.profiles enable row level security;

-- Le public (clé anon) peut SOUMETTRE un formulaire, mais pas lire.
create policy "Public can submit inscriptions"
  on public.inscription_requests for insert
  to anon, authenticated
  with check (true);

create policy "Public can submit contact messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Chacun lit / met à jour son propre profil.
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ── Création automatique du profil à l'inscription ─────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
