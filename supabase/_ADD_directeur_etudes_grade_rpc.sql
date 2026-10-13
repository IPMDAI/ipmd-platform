-- D4 — Correction exceptionnelle d'une note par le Directeur des Études.
-- Le DÉ ne peut PAS faire d'UPDATE direct sur les notes d'un autre enseignant
-- (RLS inchangée : owns_course pour l'enseignant, admin/super pour l'admin).
-- La correction passe OBLIGATOIREMENT par cette RPC atomique (motif + audit).

-- 1) Lecture : le DÉ doit pouvoir CONSULTER les notes pour les corriger.
drop policy if exists "DE read grades" on public.grades;
create policy "DE read grades" on public.grades
  for select using (public.current_user_role() = 'directeur_etudes'::public.user_role);

-- 2) RPC atomique de correction.
create or replace function public.directeur_etudes_update_grade(
  p_grade_id uuid, p_new_score numeric, p_reason text
) returns void
language plpgsql security definer set search_path to 'public' as $$
declare
  v_old numeric; v_course uuid; v_student uuid; v_max numeric; v_title text;
  v_owner uuid; v_action text;
begin
  -- (1) rôle
  if public.current_user_role() is distinct from 'directeur_etudes'::public.user_role then
    raise exception 'forbidden: role directeur_etudes requis';
  end if;
  -- (4) motif obligatoire
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required: motif obligatoire';
  end if;
  -- (2) la note / l'étudiant / le cours existent
  select score, course_id, student_id, max_score, title
    into v_old, v_course, v_student, v_max, v_title
    from public.grades where id = p_grade_id;
  if v_course is null then raise exception 'grade_not_found: note introuvable'; end if;
  if p_new_score is null or p_new_score < 0 or p_new_score > v_max then
    raise exception 'score_invalid: la note doit être entre 0 et %', v_max;
  end if;
  -- (3) enseignant propriétaire du cours
  select teacher_id into v_owner from public.courses where id = v_course;
  -- distinction d'audit : Cas A (DÉ = propriétaire) vs Cas B (autre enseignant)
  v_action := case when v_owner = auth.uid()
                   then 'grade.update_as_teacher'
                   else 'grade.update_as_directeur_etudes' end;
  -- (5+6) ancienne valeur capturée ci-dessus ; applique la nouvelle valeur
  update public.grades set score = p_new_score where id = p_grade_id;
  -- (7+8) audit DANS LA MÊME TRANSACTION : si le log échoue, tout est annulé
  perform public.log_audit(
    'update', v_action, 'grades', p_grade_id, v_student, null, null, v_owner,
    jsonb_build_object('score', v_old),
    jsonb_build_object('score', p_new_score),
    p_reason,
    format('Note « %s » : %s → %s /%s', v_title, v_old, p_new_score, v_max)
  );
end $$;

grant execute on function public.directeur_etudes_update_grade(uuid, numeric, text) to authenticated;
