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
