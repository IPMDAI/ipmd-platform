-- ════════════════════════════════════════════════════════════════
-- IPMD — MESSAGERIE OFFICIELLE : 5 migrations, DANS L'ORDRE.
-- Copier-coller TOUT, puis RUN. Idempotent. (NE PAS lancer social.sql)
-- ════════════════════════════════════════════════════════════════

-- ███  internal-messages.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Messagerie interne (utilisateur ↔ administration)
-- Étudiants / parents / enseignants écrivent à l'administration
-- (question, justification d'absence, scolarité…) ; l'admin répond.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'question',
  subject text not null,
  body text not null,
  admin_reply text,
  status text not null default 'nouveau', -- nouveau | repondu
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.internal_messages enable row level security;

drop policy if exists "Send own messages" on public.internal_messages;
create policy "Send own messages" on public.internal_messages
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists "Read own messages" on public.internal_messages;
create policy "Read own messages" on public.internal_messages
  for select to authenticated using (sender_id = auth.uid());

drop policy if exists "Admins read messages" on public.internal_messages;
create policy "Admins read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins reply messages" on public.internal_messages;
create policy "Admins reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));


-- ███  messaging-roles.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Rôles Scolarité & Pédagogie + routage de la messagerie
-- À exécuter dans Supabase > SQL Editor APRÈS internal-messages.sql.
-- ⚠️ Si erreur « ALTER TYPE ... cannot run inside a transaction »,
--    exécute d'abord SEULES les 2 lignes « alter type » ci-dessous,
--    puis relance le reste.
-- ──────────────────────────────────────────────────────────────

alter type public.user_role add value if not exists 'scolarite';
alter type public.user_role add value if not exists 'pedagogie';

-- Service destinataire d'un message (admin | scolarite | pedagogie).
alter table public.internal_messages
  add column if not exists recipient_role text not null default 'admin';

-- Lecture par service.
drop policy if exists "Scolarite read messages" on public.internal_messages;
create policy "Scolarite read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role()::text = 'scolarite' and recipient_role = 'scolarite');

drop policy if exists "Pedagogie read messages" on public.internal_messages;
create policy "Pedagogie read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role()::text = 'pedagogie' and recipient_role = 'pedagogie');

-- Réponse par service.
drop policy if exists "Scolarite reply messages" on public.internal_messages;
create policy "Scolarite reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role()::text = 'scolarite' and recipient_role = 'scolarite')
  with check (public.current_user_role()::text = 'scolarite' and recipient_role = 'scolarite');

drop policy if exists "Pedagogie reply messages" on public.internal_messages;
create policy "Pedagogie reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role()::text = 'pedagogie' and recipient_role = 'pedagogie')
  with check (public.current_user_role()::text = 'pedagogie' and recipient_role = 'pedagogie');


-- ███  class-announcements.sql

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
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie')
  );

drop policy if exists "Post class announcements" on public.class_announcements;
create policy "Post class announcements" on public.class_announcements
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.teaches_class(class_id)
      or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie')
    )
  );

drop policy if exists "Delete class announcements" on public.class_announcements;
create policy "Delete class announcements" on public.class_announcements
  for delete to authenticated
  using (
    author_id = auth.uid()
    or public.current_user_role()::text in ('admin', 'super_admin')
  );


-- ███  announcement-targeting.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Ciblage des annonces (filière / niveau / univers)
-- À exécuter dans Supabase > SQL Editor APRÈS announcements.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.announcements
  add column if not exists target_type text not null default 'all'; -- all | filiere | niveau | univers
alter table public.announcements
  add column if not exists target_value text;


-- ███  moderation.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Modération : signalements + archivage
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

-- Archivage des messages internes (traçabilité).
alter table public.internal_messages
  add column if not exists archived boolean not null default false;

-- Signalements de contenu.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null, -- class_announcement | announcement | internal_message
  content_id uuid not null,
  reason text,
  status text not null default 'open', -- open | resolved
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;

drop policy if exists "Report content" on public.content_reports;
create policy "Report content" on public.content_reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "Read own reports" on public.content_reports;
create policy "Read own reports" on public.content_reports
  for select to authenticated using (reporter_id = auth.uid());

drop policy if exists "Admins read reports" on public.content_reports;
create policy "Admins read reports" on public.content_reports
  for select to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins resolve reports" on public.content_reports;
create policy "Admins resolve reports" on public.content_reports
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

