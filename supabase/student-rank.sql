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
