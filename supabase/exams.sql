-- ──────────────────────────────────────────────────────────────
-- IPMD — Examens en ligne (QCM auto-corrigés)
-- À exécuter dans Supabase > SQL Editor APRÈS enrollments.sql + grades-types.sql.
-- Les bonnes réponses ne sont JAMAIS exposées aux étudiants (RPC sécurisées).
-- ──────────────────────────────────────────────────────────────

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index int not null,
  points numeric(4, 1) not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(6, 2) not null,
  max_score numeric(6, 2) not null,
  answers jsonb,
  submitted_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_submissions enable row level security;

-- L'enseignant propriétaire de l'examen (via son cours).
create or replace function public.owns_exam(p_exam_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.exams e
    join public.courses c on c.id = e.course_id
    where e.id = p_exam_id and c.teacher_id = auth.uid()
  );
$$;

-- ── Examens ────────────────────────────────────────────────────
drop policy if exists "Teachers manage exams" on public.exams;
create policy "Teachers manage exams" on public.exams for all to authenticated
  using (public.owns_course(course_id)) with check (public.owns_course(course_id));

drop policy if exists "Admins read exams" on public.exams;
create policy "Admins read exams" on public.exams for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Students read published exams" on public.exams;
create policy "Students read published exams" on public.exams for select to authenticated
  using (published = true and public.is_enrolled(course_id));

-- ── Questions (jamais lues directement par les étudiants) ──────
drop policy if exists "Teachers manage questions" on public.exam_questions;
create policy "Teachers manage questions" on public.exam_questions for all to authenticated
  using (public.owns_exam(exam_id)) with check (public.owns_exam(exam_id));

drop policy if exists "Admins read questions" on public.exam_questions;
create policy "Admins read questions" on public.exam_questions for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

-- ── Copies / résultats ─────────────────────────────────────────
drop policy if exists "Teachers read submissions" on public.exam_submissions;
create policy "Teachers read submissions" on public.exam_submissions for select to authenticated
  using (public.owns_exam(exam_id));

drop policy if exists "Students read own submissions" on public.exam_submissions;
create policy "Students read own submissions" on public.exam_submissions for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Admins read submissions" on public.exam_submissions;
create policy "Admins read submissions" on public.exam_submissions for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

-- ── RPC : questions pour l'étudiant (SANS la bonne réponse) ────
create or replace function public.get_exam_questions(p_exam_id uuid)
returns table (id uuid, question text, options text[], points numeric)
language sql stable security definer set search_path = public
as $$
  select q.id, q.question, q.options, q.points
  from public.exam_questions q
  join public.exams e on e.id = q.exam_id
  where q.exam_id = p_exam_id
    and e.published = true
    and public.is_enrolled(e.course_id)
  order by q.created_at;
$$;

-- ── RPC : soumission + correction automatique ──────────────────
create or replace function public.submit_exam(p_exam_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_course uuid;
  v_pub boolean;
  v_title text;
  v_student uuid := auth.uid();
  v_score numeric := 0;
  v_max numeric := 0;
  q record;
  v_ans int;
begin
  select course_id, published, title into v_course, v_pub, v_title
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

  insert into public.grades (course_id, student_id, title, score, max_score, type, coefficient)
    values (v_course, v_student, v_title, v_score, v_max, 'examen', 1);

  return jsonb_build_object('score', v_score, 'max', v_max);
end;
$$;

grant execute on function public.get_exam_questions(uuid) to authenticated;
grant execute on function public.submit_exam(uuid, jsonb) to authenticated;
