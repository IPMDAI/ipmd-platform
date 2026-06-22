-- ──────────────────────────────────────────────────────────────
-- IPMD — Recrutement des enseignants (Étape C / RH)
-- À exécuter dans Supabase > SQL Editor APRÈS roles-rbac.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,              -- matière / domaine visé
  availability text,         -- disponibilités
  syllabus text,             -- syllabus proposé (analysé par l'IA)
  cv_url text,
  diploma_url text,
  authorization_url text,
  message text,
  status text not null default 'nouveau',
  ai_summary text,           -- analyse IA (résumé + adéquation + 80% pratique)
  created_at timestamptz not null default now()
);

alter table public.teacher_applications enable row level security;

-- Le public peut postuler (comme le formulaire d'inscription étudiant).
drop policy if exists "Public submit applications" on public.teacher_applications;
create policy "Public submit applications"
  on public.teacher_applications for insert
  to anon, authenticated
  with check (true);

-- Les admins (RH / Pédagogie) lisent et gèrent les candidatures.
drop policy if exists "Admins manage applications" on public.teacher_applications;
create policy "Admins manage applications"
  on public.teacher_applications for all
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
