-- ══════════════════════════════════════════════════════════════
-- IPMD — Module Partenaires (académiques, entreprises, associations).
-- Vitrine publique + gestion back-office + logos.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'entreprise', -- academique | entreprise | association
  logo_url text,
  website text,
  description text,
  status text not null default 'actif',          -- actif | inactif
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists partners_category_idx on public.partners (category, sort_order);

alter table public.partners enable row level security;

-- Lecture PUBLIQUE des partenaires actifs (vitrine du site).
drop policy if exists "Public reads active partners" on public.partners;
create policy "Public reads active partners" on public.partners for select to anon, authenticated
  using (status = 'actif');

-- L'administration gère tout.
drop policy if exists "Staff manage partners" on public.partners;
create policy "Staff manage partners" on public.partners for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- ── Bucket public pour les logos ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "Partner logos public read" on storage.objects;
create policy "Partner logos public read" on storage.objects for select
  using (bucket_id = 'partner-logos');

drop policy if exists "Staff upload partner logos" on storage.objects;
create policy "Staff upload partner logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-logos' and public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Staff update partner logos" on storage.objects;
create policy "Staff update partner logos" on storage.objects for update to authenticated
  using (bucket_id = 'partner-logos' and public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Staff delete partner logos" on storage.objects;
create policy "Staff delete partner logos" on storage.objects for delete to authenticated
  using (bucket_id = 'partner-logos' and public.current_user_role() in ('super_admin', 'admin'));
