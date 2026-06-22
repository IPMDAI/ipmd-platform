-- ──────────────────────────────────────────────────────────────
-- IPMD — Annonces de classe (enseignant / pédagogie → élèves d'une classe)
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.class_announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.class_announcements enable row level security;

-- L'enseignant a-t-il un créneau dans cette classe ?
create or replace function public.teaches_class(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.timetable_slots t
    where t.class_id = cid and t.teacher_id = auth.uid()
  );
$$;

-- L'utilisateur est-il membre (étudiant) de cette classe ?
create or replace function public.in_class(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.class_members m
    where m.class_id = cid and m.student_id = auth.uid()
  );
$$;

drop policy if exists "Read class announcements" on public.class_announcements;
create policy "Read class announcements" on public.class_announcements
  for select to authenticated
  using (
    public.in_class(class_id)
    or author_id = auth.uid()
    or public.teaches_class(class_id)
    or public.current_user_role() in ('admin', 'super_admin', 'pedagogie')
  );

drop policy if exists "Post class announcements" on public.class_announcements;
create policy "Post class announcements" on public.class_announcements
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.teaches_class(class_id)
      or public.current_user_role() in ('admin', 'super_admin', 'pedagogie')
    )
  );

drop policy if exists "Delete class announcements" on public.class_announcements;
create policy "Delete class announcements" on public.class_announcements
  for delete to authenticated
  using (
    author_id = auth.uid()
    or public.current_user_role() in ('admin', 'super_admin')
  );
