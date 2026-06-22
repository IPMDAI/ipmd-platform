-- ════════════════════════════════════════════════════════════════
-- IPMD — MIGRATIONS À EXÉCUTER (regroupées, dans l'ordre)
-- Copier-coller TOUT ce fichier dans Supabase > SQL Editor, puis RUN.
-- Idempotent : peut être ré-exécuté sans risque.
-- ════════════════════════════════════════════════════════════════


-- ███████████████████████████████████████████████████████████████
-- ███  profile-guard.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Sécurité : empêcher l'auto-modification du rôle
-- La policy "Users update own profile" autorise un utilisateur à modifier
-- sa propre ligne (nom, etc.). Sans garde-fou, il pourrait aussi changer
-- son `role` et s'auto-promouvoir. Ce trigger ignore tout changement de
-- rôle qui ne vient pas d'un Super Admin.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if NEW.role is distinct from OLD.role
     and public.current_user_role() is distinct from 'super_admin' then
    NEW.role := OLD.role; -- on conserve l'ancien rôle
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();


-- ███████████████████████████████████████████████████████████████
-- ███  candidatures-status.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Pipeline d'inscription : statut des candidatures
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql + admin-reads.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.inscription_requests
  add column if not exists status text not null default 'nouveau';
alter table public.inscription_requests
  add column if not exists admin_note text;

-- Les admins peuvent faire évoluer le statut d'une candidature.
drop policy if exists "Admins update inscription_requests" on public.inscription_requests;
create policy "Admins update inscription_requests"
  on public.inscription_requests
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));


-- ███████████████████████████████████████████████████████████████
-- ███  grades-semester.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Semestre sur les notes (bulletin par semestre)
-- À exécuter dans Supabase > SQL Editor APRÈS grades-types.sql + exams.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.grades add column if not exists semester text;
alter table public.exams add column if not exists semester text;

-- La note générée par un examen reprend le semestre de l'examen.
create or replace function public.submit_exam(p_exam_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_course uuid;
  v_pub boolean;
  v_title text;
  v_sem text;
  v_student uuid := auth.uid();
  v_score numeric := 0;
  v_max numeric := 0;
  q record;
  v_ans int;
begin
  select course_id, published, title, semester
    into v_course, v_pub, v_title, v_sem
  from public.exams where id = p_exam_id;
  if v_course is null then raise exception 'Examen introuvable'; end if;
  if not v_pub then raise exception 'Examen non publie'; end if;
  if not public.is_enrolled(v_course) then raise exception 'Non inscrit a ce cours'; end if;
  if exists (select 1 from public.exam_submissions where exam_id = p_exam_id and student_id = v_student) then
    raise exception 'Examen deja passe';
  end if;

  for q in select id, correct_index, points from public.exam_questions where exam_id = p_exam_id loop
    v_max := v_max + q.points;
    v_ans := nullif(p_answers ->> q.id::text, '')::int;
    if v_ans is not null and v_ans = q.correct_index then
      v_score := v_score + q.points;
    end if;
  end loop;

  insert into public.exam_submissions (exam_id, student_id, score, max_score, answers)
    values (p_exam_id, v_student, v_score, v_max, p_answers);

  insert into public.grades (course_id, student_id, title, score, max_score, type, coefficient, semester)
    values (v_course, v_student, v_title, v_score, v_max, 'examen', 1, v_sem);

  return jsonb_build_object('score', v_score, 'max', v_max);
end;
$$;


-- ███████████████████████████████████████████████████████████████
-- ███  grades-validation.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Validation des notes (bulletin officiel)
-- Les notes saisies par l'enseignant restent « en_attente ». Le bulletin
-- officiel n'est délivré que lorsque l'administration les a validées.
-- À exécuter dans Supabase > SQL Editor APRÈS grades.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.grades
  add column if not exists status text not null default 'en_attente';

-- Les notes déjà saisies sont considérées comme validées (continuité).
update public.grades set status = 'valide' where status = 'en_attente';

-- L'administration peut modifier les notes (pour les valider).
drop policy if exists "Admins update grades" on public.grades;
create policy "Admins update grades" on public.grades
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

-- Garde-fou : seul un admin / super admin peut passer une note à « valide ».
-- Une note insérée/éditée par un enseignant reste « en_attente ».
create or replace function public.guard_grade_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('admin', 'super_admin') then
    if TG_OP = 'INSERT' then
      NEW.status := 'en_attente';
    elsif NEW.status is distinct from OLD.status then
      NEW.status := OLD.status;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_grade_status on public.grades;
create trigger guard_grade_status
  before insert or update on public.grades
  for each row execute function public.guard_grade_status();


-- ███████████████████████████████████████████████████████████████
-- ███  payment-schedules.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Échéancier de paiement
-- L'administration définit des échéances (montant + date) par étudiant.
-- Le statut (payée / à venir / en retard) est calculé côté application
-- à partir du total déjà payé.
-- À exécuter dans Supabase > SQL Editor APRÈS finance.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  amount numeric(12, 2) not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

alter table public.payment_schedules enable row level security;

drop policy if exists "Admins manage schedules" on public.payment_schedules;
create policy "Admins manage schedules" on public.payment_schedules
  for all to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Students read own schedule" on public.payment_schedules;
create policy "Students read own schedule" on public.payment_schedules
  for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Parents read children schedule" on public.payment_schedules;
create policy "Parents read children schedule" on public.payment_schedules
  for select to authenticated
  using (public.is_parent_of(student_id));


-- ███████████████████████████████████████████████████████████████
-- ███  timetable-status.sql
-- ███████████████████████████████████████████████████████████████

-- ──────────────────────────────────────────────────────────────
-- IPMD — Statut des créneaux d'emploi du temps
-- Marqueur posé par l'administration sur un créneau : prévu / reporté /
-- annulé / terminé (outil de communication rapide vers les étudiants).
-- À exécuter dans Supabase > SQL Editor APRÈS planning.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.timetable_slots
  add column if not exists status text not null default 'prevu';

