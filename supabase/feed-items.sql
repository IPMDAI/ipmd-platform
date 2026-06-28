-- ══════════════════════════════════════════════════════════════
-- IPMD — Actu & Opportunités (IPMD News / Jobs / Opportunities)
-- Une seule table, discriminée par `kind`. Vitrine publique (publié)
-- + gestion back-office (admin).
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('news', 'jobs', 'opportunities')),
  title text not null,
  subtitle text,                 -- entreprise / source
  category text,                 -- catégorie (filtre principal)
  summary text,
  icon text,                     -- emoji
  image_url text,                -- image optionnelle (URL)
  href text,                     -- lien externe éventuel
  date_label text,               -- date affichée (publication)
  reading_time text,             -- temps de lecture (news)
  deadline text,                 -- date limite (jobs / opportunities)
  status text,                   -- opportunités : candidatures ouvertes / bientôt clôturé / terminé
  meta text[] not null default '{}',   -- étiquettes affichées (type, ville, mode…)
  tags text[] not null default '{}',   -- mots-clés de filtrage
  published boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_items_kind_idx
  on public.feed_items (kind, published, featured desc, sort_order, created_at desc);

-- Mise à jour automatique de updated_at
create or replace function public.feed_items_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists feed_items_touch on public.feed_items;
create trigger feed_items_touch before update on public.feed_items
  for each row execute function public.feed_items_touch();

alter table public.feed_items enable row level security;

-- Lecture PUBLIQUE des éléments publiés (site vitrine).
drop policy if exists "Public reads published feed" on public.feed_items;
create policy "Public reads published feed" on public.feed_items for select to anon, authenticated
  using (published = true);

-- L'administration gère tout (y compris les brouillons non publiés).
drop policy if exists "Staff manage feed" on public.feed_items;
create policy "Staff manage feed" on public.feed_items for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
