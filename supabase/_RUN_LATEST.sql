-- ════════════════════════════════════════════════════════════════
-- IPMD — DERNIERS SQL regroupés (présences parent + rang + Finance v2)
-- Colle TOUT, puis RUN une seule fois. Idempotent (re-exécutable).
-- ════════════════════════════════════════════════════════════════

-- ███████████  parent-sessions.sql  ███████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Le parent peut lire les séances datées de la classe de son enfant
-- (pour afficher le suivi des présences côté parent).
-- À exécuter dans Supabase > SQL Editor APRÈS course-sessions.sql + session-attendance.sql.
-- 1 seule policy. Idempotent.
-- ──────────────────────────────────────────────────────────────

drop policy if exists "Parent reads child sessions" on public.course_sessions;
create policy "Parent reads child sessions" on public.course_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.class_members m
      where m.class_id = course_sessions.class_id
        and public.is_parent_of(m.student_id)
    )
  );


-- ███████████  student-rank.sql  ███████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Rang / classement de l'étudiant (sans exposer les notes d'autrui)
-- Fonction SECURITY DEFINER : calcule le rang à partir des notes validées
-- de la classe, et ne renvoie QUE { rang, total, moyenne de classe }.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create or replace function public.student_rank(p_student uuid, p_semester text default null)
returns table (rank int, total int, class_avg numeric)
language plpgsql security definer set search_path = public stable as $$
declare
  v_class uuid;
begin
  -- Autorisation : soi-même, parent de l'élève, ou service.
  if not (
    auth.uid() = p_student
    or public.is_parent_of(p_student)
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite')
  ) then
    return;
  end if;

  select class_id into v_class
  from public.class_members
  where student_id = p_student
  limit 1;
  if v_class is null then
    return;
  end if;

  return query
  with avgs as (
    select g.student_id,
      sum((g.score::numeric / nullif(g.max_score, 0)) * 20 * coalesce(g.coefficient, 1))
        / nullif(sum(coalesce(g.coefficient, 1)), 0) as moy
    from public.grades g
    join public.class_members m
      on m.student_id = g.student_id and m.class_id = v_class
    where g.status = 'valide'
      and (p_semester is null or p_semester = '' or g.semester = p_semester)
    group by g.student_id
  ),
  ranked as (
    select student_id, moy, rank() over (order by moy desc) as rnk
    from avgs
    where moy is not null
  )
  select
    (select rnk from ranked where student_id = p_student)::int,
    (select count(*) from ranked)::int,
    (select round(avg(moy), 2) from ranked)::numeric;
end;
$$;

grant execute on function public.student_rank(uuid, text) to authenticated;


-- ███████████  _RUN_FINANCE2.sql  ███████████

-- ════════════════════════════════════════════════════════════════
-- IPMD — FINANCE v2 (Phase 1) : inscription séparée, scolarité par
-- niveau, réduction paiement unique, statuts & accès, paiement enrichi.
-- Copier-coller TOUT, puis RUN. Idempotent. (Après finance.sql)
-- ════════════════════════════════════════════════════════════════

-- ── Paramètres globaux (singleton) ─────────────────────────────
create table if not exists public.finance_settings (
  id int primary key default 1,
  registration_fee numeric(12, 2) not null default 300000,
  lump_sum_discount numeric(5, 4) not null default 0.15,
  academic_year text default '2025-2026',
  updated_at timestamptz not null default now(),
  constraint finance_settings_singleton check (id = 1)
);
insert into public.finance_settings (id) values (1) on conflict (id) do nothing;

-- ── Frais de scolarité par niveau ──────────────────────────────
create table if not exists public.tuition_levels (
  level text primary key,
  amount numeric(12, 2) not null default 0,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.tuition_levels (level, sort_order) values
  ('Licence 1', 1), ('Licence 2', 2), ('Licence 3', 3),
  ('Master 1', 4), ('Master 2', 5),
  ('Bootcamp', 6), ('Executive', 7)
  on conflict (level) do nothing;

-- ── Extension du dossier financier de l'étudiant ───────────────
alter table public.student_finance add column if not exists registration_fee numeric(12, 2) not null default 300000;
alter table public.student_finance add column if not exists tuition_due numeric(12, 2) not null default 0;
alter table public.student_finance add column if not exists discount_rate numeric(5, 4) not null default 0;
alter table public.student_finance add column if not exists level text;
alter table public.student_finance add column if not exists program text;
alter table public.student_finance add column if not exists academic_year text;
alter table public.student_finance add column if not exists status text;          -- statut financier manuel/négocié
alter table public.student_finance add column if not exists access_state text not null default 'actif'; -- actif | pause | bloque
alter table public.student_finance add column if not exists negotiated boolean not null default false;

-- ── Enrichissement des paiements ───────────────────────────────
alter table public.payments add column if not exists reference text;
alter table public.payments add column if not exists kind text not null default 'scolarite'; -- inscription | scolarite
alter table public.payments add column if not exists recorded_by uuid references public.profiles (id);
alter table public.payments add column if not exists observation text;

-- ── RLS : la Scolarité gère aussi (cast ::text) ────────────────
alter table public.finance_settings enable row level security;
alter table public.tuition_levels enable row level security;

drop policy if exists "Staff manage finance settings" on public.finance_settings;
create policy "Staff manage finance settings" on public.finance_settings for all to authenticated
  using (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'));

drop policy if exists "Staff manage tuition levels" on public.tuition_levels;
create policy "Staff manage tuition levels" on public.tuition_levels for all to authenticated
  using (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'));

drop policy if exists "Admins manage finance" on public.student_finance;
create policy "Admins manage finance" on public.student_finance for all to authenticated
  using (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'));

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments" on public.payments for all to authenticated
  using (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'));

drop policy if exists "Admins manage schedules" on public.payment_schedules;
create policy "Admins manage schedules" on public.payment_schedules for all to authenticated
  using (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'))
  with check (public.current_user_role()::text in ('super_admin', 'admin', 'scolarite'));

