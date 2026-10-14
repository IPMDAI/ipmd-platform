-- D3.1 — Pérennité HUMAINE du journal : figer le contexte au moment de l'action.
-- Les UUID techniques restent dans actor_id/student_id/teacher_id/class_id/
-- module_id/entity_id. On ajoute des SNAPSHOTS figés (jamais recalculés) pour
-- que le journal reste lisible même après suppression des comptes/entités.
-- Additif, nullable, best-effort. N'altère AUCUNE ligne existante.

alter table public.audit_log add column if not exists actor_name text;
alter table public.audit_log add column if not exists actor_email text;
alter table public.audit_log add column if not exists context_snapshot jsonb;

-- log_audit : + p_context (noms fournis par l'appelant). actor_name/actor_email
-- sont déterminés CÔTÉ BASE à partir de l'acteur réel (auth.uid()) : le client
-- ne peut pas choisir l'identité inscrite dans l'audit.
create or replace function public.log_audit(
  p_action_type text, p_action text, p_entity_type text,
  p_entity_id uuid default null, p_student_id uuid default null,
  p_class_id uuid default null, p_module_id uuid default null,
  p_teacher_id uuid default null, p_old jsonb default null,
  p_new jsonb default null, p_reason text default null, p_summary text default null,
  p_context jsonb default null
) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_name text; v_email text;
begin
  select full_name, email into v_name, v_email from public.profiles where id = auth.uid();
  insert into public.audit_log(actor_id,actor_role,actor_name,actor_email,action_type,action,
    entity_type,entity_id,student_id,class_id,module_id,teacher_id,old_value,new_value,reason,
    summary,context_snapshot)
  values (auth.uid(), public.current_user_role(), v_name, v_email, p_action_type, p_action,
    p_entity_type, p_entity_id, p_student_id, p_class_id, p_module_id, p_teacher_id, p_old, p_new,
    p_reason, p_summary, p_context)
  returning id into v_id;
  return v_id;
end $$;

-- audit_row : snapshots best-effort (lookups scalaires = null si absent, jamais
-- d'erreur → n'empêche jamais la création de l'audit ni l'opération métier).
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare j_old jsonb; j_new jsonb; v_sid uuid; v_cid uuid; v_mid uuid; v_tid uuid;
        v_name text; v_email text; v_ctx jsonb;
begin
  j_old := case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end;
  j_new := case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end;
  v_sid := nullif(coalesce(j_new->>'student_id', j_old->>'student_id'),'')::uuid;
  v_cid := nullif(coalesce(j_new->>'class_id',   j_old->>'class_id'),'')::uuid;
  v_mid := nullif(coalesce(j_new->>'module_id',  j_old->>'module_id'),'')::uuid;
  v_tid := nullif(coalesce(j_new->>'teacher_id', j_old->>'teacher_id'),'')::uuid;
  select full_name, email into v_name, v_email from public.profiles where id = auth.uid();
  v_ctx := jsonb_strip_nulls(jsonb_build_object(
    'student_name', (select full_name from public.profiles where id = v_sid),
    'teacher_name', (select full_name from public.profiles where id = v_tid),
    'class_name',   (select name      from public.classes  where id = v_cid),
    'module_name',  (select name      from public.modules  where id = v_mid),
    'entity_label', coalesce(j_new->>'title', j_new->>'name', j_new->>'label',
                             j_old->>'title', j_old->>'name', j_old->>'label')
  ));
  insert into public.audit_log(actor_id,actor_role,actor_name,actor_email,action_type,action,
    entity_type,entity_id,student_id,class_id,module_id,teacher_id,old_value,new_value,summary,
    context_snapshot)
  values (auth.uid(), public.current_user_role(), v_name, v_email,
    case TG_OP when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME,
    nullif(coalesce(j_new->>'id', j_old->>'id'),'')::uuid,
    v_sid, v_cid, v_mid, v_tid, j_old, j_new, TG_TABLE_NAME || ' ' || lower(TG_OP),
    nullif(v_ctx, '{}'::jsonb));
  return null;
end $$;

-- RPC correction de note : passe le contexte humain (student/teacher/course).
create or replace function public.directeur_etudes_update_grade(
  p_grade_id uuid, p_new_score numeric, p_reason text
) returns void
language plpgsql security definer set search_path to 'public' as $$
declare
  v_old numeric; v_course uuid; v_student uuid; v_max numeric; v_title text;
  v_owner uuid; v_action text; v_ctx jsonb; v_course_title text;
begin
  if public.current_user_role() is distinct from 'directeur_etudes'::public.user_role then
    raise exception 'forbidden: role directeur_etudes requis';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required: motif obligatoire';
  end if;
  select score, course_id, student_id, max_score, title
    into v_old, v_course, v_student, v_max, v_title
    from public.grades where id = p_grade_id;
  if v_course is null then raise exception 'grade_not_found: note introuvable'; end if;
  if p_new_score is null or p_new_score < 0 or p_new_score > v_max then
    raise exception 'score_invalid: la note doit être entre 0 et %', v_max;
  end if;
  select teacher_id, title into v_owner, v_course_title from public.courses where id = v_course;
  v_action := case when v_owner = auth.uid()
                   then 'grade.update_as_teacher'
                   else 'grade.update_as_directeur_etudes' end;
  v_ctx := jsonb_strip_nulls(jsonb_build_object(
    'student_name', (select full_name from public.profiles where id = v_student),
    'teacher_name', (select full_name from public.profiles where id = v_owner),
    'course_name',  v_course_title,
    'entity_label', v_title
  ));
  update public.grades set score = p_new_score where id = p_grade_id;
  perform public.log_audit(
    'update', v_action, 'grades', p_grade_id, v_student, null, null, v_owner,
    jsonb_build_object('score', v_old),
    jsonb_build_object('score', p_new_score),
    p_reason,
    format('Note « %s » : %s → %s /%s', v_title, v_old, p_new_score, v_max),
    v_ctx
  );
end $$;
