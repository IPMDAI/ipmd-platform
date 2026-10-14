-- =============================================================================
-- D7-2 — Affectations pédagogiques SÉCURISÉES (DB/sécurité)
-- =============================================================================
-- On verrouille EN BASE les changements d'enseignant (module / créneau / séance)
-- sans toucher au recrutement/RH. Jamais : teacher_pay, payouts, rôles, comptes,
-- recrutement, staffing_requests.assigned_profile_id, données RH, courses.teacher_id.
--
-- Choix de l'UNIQUE écrivain d'audit (1 affectation = 1 trace) :
--   • Module  : modules n'a PAS de trigger audit → la RPC appelle log_audit (seul).
--   • Créneau : timetable_slots a déjà audit_row → c'est LUI (pas de log_audit).
--   • Séance  : course_sessions a déjà audit_row → c'est LUI, enrichi du motif via
--               le GUC app.audit_reason (audit_row lit ce motif).
-- Concurrence : UPDATE ... WHERE teacher_id IS NOT DISTINCT FROM <attendu> → pas
--   d'écrasement silencieux. Contournement fermé : changer teacher_id en direct
--   (REST/SQL) est refusé (garde = jeton de transaction + contexte privilégié) ;
--   les AUTRES champs académiques (D2) restent modifiables.
-- =============================================================================

-- 1) RÈGLE D'ÉLIGIBILITÉ UNIQUE ----------------------------------------------
-- Enseignant éligible = role enseignant OU directeur_etudes QUI enseigne (même
-- compte), AVEC une fiche teacher_profiles au statut valide/actif (valeurs
-- réelles src/lib/teacher.ts). Renvoie un booléen : aucun accès RH exposé.
create or replace function public.is_pedagogically_eligible_teacher(p_profile uuid)
returns boolean
language sql security definer set search_path to 'public' stable as $$
  select exists (
    select 1
    from public.profiles p
    join public.teacher_profiles tp on tp.teacher_id = p.id
    where p.id = p_profile
      and p.role in ('enseignant'::public.user_role, 'directeur_etudes'::public.user_role)
      and tp.status in ('valide', 'actif')
  );
$$;
revoke execute on function public.is_pedagogically_eligible_teacher(uuid) from public, anon;
grant  execute on function public.is_pedagogically_eligible_teacher(uuid) to authenticated;

-- 2) AUDIT_ROW enrichi d'un MOTIF optionnel (app.audit_reason) ----------------
-- Additif : si le GUC n'est pas posé, reason = NULL (comportement inchangé pour
-- toutes les tables auditées). Seules nos RPC le posent (séance). Immutabilité
-- intacte (toujours un INSERT, jamais d'UPDATE/DELETE).
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare j_old jsonb; j_new jsonb; v_sid uuid; v_cid uuid; v_mid uuid; v_tid uuid;
        v_name text; v_email text; v_ctx jsonb; v_reason text;
begin
  j_old := case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end;
  j_new := case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end;
  v_sid := nullif(coalesce(j_new->>'student_id', j_old->>'student_id'),'')::uuid;
  v_cid := nullif(coalesce(j_new->>'class_id',   j_old->>'class_id'),'')::uuid;
  v_mid := nullif(coalesce(j_new->>'module_id',  j_old->>'module_id'),'')::uuid;
  v_tid := nullif(coalesce(j_new->>'teacher_id', j_old->>'teacher_id'),'')::uuid;
  v_reason := nullif(btrim(coalesce(current_setting('app.audit_reason', true), '')), '');
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
    entity_type,entity_id,student_id,class_id,module_id,teacher_id,old_value,new_value,reason,summary,
    context_snapshot)
  values (auth.uid(), public.current_user_role(), v_name, v_email,
    case TG_OP when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME,
    nullif(coalesce(j_new->>'id', j_old->>'id'),'')::uuid,
    v_sid, v_cid, v_mid, v_tid, j_old, j_new, v_reason, TG_TABLE_NAME || ' ' || lower(TG_OP),
    nullif(v_ctx, '{}'::jsonb));
  return null;
end $$;

-- 3) GARDES : teacher_id ne change QUE via les RPC dédiées -------------------
-- SECURITY INVOKER → current_user = rôle réel : 'postgres' (superuser) dans une
-- RPC SECURITY DEFINER, 'authenticated' pour un UPDATE direct. Double garde-fou :
-- jeton app.teacher_assign = txid courant ET contexte privilégié.
create or replace function public.guard_teacher_assign()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_priv boolean;
begin
  -- INSERT : éligibilité du prof posé (couvre addTimetableSlot etc.), sans jeton.
  if tg_op = 'INSERT' then
    if new.teacher_id is not null
       and not public.is_pedagogically_eligible_teacher(new.teacher_id) then
      raise exception 'enseignant non éligible pédagogiquement (statut/role)';
    end if;
    return new;
  end if;

  -- UPDATE : seul un changement de teacher_id est contrôlé (les autres champs
  -- académiques D2 restent libres).
  if new.teacher_id is distinct from old.teacher_id then
    select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv
      from pg_roles where rolname = current_user;
    if current_setting('app.teacher_assign', true) is distinct from txid_current()::text
       or not v_priv then
      raise exception 'changement d''enseignant uniquement via les RPC d''affectation pédagogique';
    end if;
    if new.teacher_id is not null
       and not public.is_pedagogically_eligible_teacher(new.teacher_id) then
      raise exception 'enseignant non éligible pédagogiquement (statut/role)';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_module_teacher on public.modules;
create trigger trg_guard_module_teacher
  before update on public.modules
  for each row execute function public.guard_teacher_assign();

drop trigger if exists trg_guard_slot_teacher on public.timetable_slots;
create trigger trg_guard_slot_teacher
  before insert or update on public.timetable_slots
  for each row execute function public.guard_teacher_assign();

drop trigger if exists trg_guard_session_teacher on public.course_sessions;
create trigger trg_guard_session_teacher
  before update on public.course_sessions
  for each row execute function public.guard_teacher_assign();

-- 4) RPC D'AFFECTATION (SECURITY DEFINER, atomiques) ------------------------
-- Rôles autorisés : directeur_etudes + admin + super_admin (pilotage pédagogique).

-- 4a) MODULE : modules.teacher_id → log_audit (seul écrivain), motif obligatoire.
create or replace function public.directeur_etudes_assign_module_teacher(
  p_module uuid, p_new_teacher uuid, p_expected_teacher uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_found boolean := false; v_name text; v_ay text; v_old_name text; v_new_name text;
begin
  if public.current_user_role() not in ('directeur_etudes'::public.user_role,
       'admin'::public.user_role, 'super_admin'::public.user_role) then
    raise exception 'réservé au Directeur des Études / Administration';
  end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if not public.is_pedagogically_eligible_teacher(p_new_teacher) then
    raise exception 'enseignant non éligible pédagogiquement';
  end if;

  perform set_config('app.teacher_assign', txid_current()::text, true);
  update public.modules set teacher_id = p_new_teacher
   where id = p_module and teacher_id is not distinct from p_expected_teacher;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'module introuvable ou enseignant modifié entre-temps (concurrence)';
  end if;

  select name, academic_year into v_name, v_ay from public.modules where id = p_module;
  select full_name into v_old_name from public.profiles where id = p_expected_teacher;
  select full_name into v_new_name from public.profiles where id = p_new_teacher;
  perform public.log_audit(
    p_action_type => 'update', p_action => 'module.assign_teacher',
    p_entity_type => 'module', p_entity_id => p_module, p_module_id => p_module,
    p_teacher_id => p_new_teacher,
    p_old => jsonb_build_object('teacher_id', p_expected_teacher),
    p_new => jsonb_build_object('teacher_id', p_new_teacher),
    p_reason => p_reason, p_summary => 'Affectation pédagogique: enseignant du module',
    p_context => jsonb_strip_nulls(jsonb_build_object(
      'module_name', v_name, 'academic_year', v_ay,
      'old_teacher_name', v_old_name, 'new_teacher_name', v_new_name)));
end $$;

-- 4b) CRÉNEAU : timetable_slots.teacher_id → audit via trigger audit_row (seul).
create or replace function public.directeur_etudes_assign_slot_teacher(
  p_slot uuid, p_new_teacher uuid, p_expected_teacher uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_found boolean := false;
begin
  if public.current_user_role() not in ('directeur_etudes'::public.user_role,
       'admin'::public.user_role, 'super_admin'::public.user_role) then
    raise exception 'réservé au Directeur des Études / Administration';
  end if;
  if not public.is_pedagogically_eligible_teacher(p_new_teacher) then
    raise exception 'enseignant non éligible pédagogiquement';
  end if;
  perform set_config('app.teacher_assign', txid_current()::text, true);
  update public.timetable_slots set teacher_id = p_new_teacher
   where id = p_slot and teacher_id is not distinct from p_expected_teacher;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'créneau introuvable ou enseignant modifié entre-temps (concurrence)';
  end if;
end $$;

-- 4c) SÉANCE : substitution exceptionnelle. Ne touche QUE la séance (jamais le
-- créneau/module permanent). Audit via trigger audit_row enrichi du motif.
create or replace function public.directeur_etudes_substitute_session_teacher(
  p_session uuid, p_new_teacher uuid, p_expected_teacher uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_found boolean := false;
begin
  if public.current_user_role() not in ('directeur_etudes'::public.user_role,
       'admin'::public.user_role, 'super_admin'::public.user_role) then
    raise exception 'réservé au Directeur des Études / Administration';
  end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if not public.is_pedagogically_eligible_teacher(p_new_teacher) then
    raise exception 'enseignant non éligible pédagogiquement';
  end if;
  perform set_config('app.teacher_assign', txid_current()::text, true);
  perform set_config('app.audit_reason', p_reason, true);
  update public.course_sessions set teacher_id = p_new_teacher
   where id = p_session and teacher_id is not distinct from p_expected_teacher;
  get diagnostics v_found = row_count;
  if not v_found then
    raise exception 'séance introuvable ou enseignant modifié entre-temps (concurrence)';
  end if;
end $$;

revoke execute on function public.directeur_etudes_assign_module_teacher(uuid,uuid,uuid,text) from public, anon;
revoke execute on function public.directeur_etudes_assign_slot_teacher(uuid,uuid,uuid) from public, anon;
revoke execute on function public.directeur_etudes_substitute_session_teacher(uuid,uuid,uuid,text) from public, anon;
grant  execute on function public.directeur_etudes_assign_module_teacher(uuid,uuid,uuid,text) to authenticated;
grant  execute on function public.directeur_etudes_assign_slot_teacher(uuid,uuid,uuid) to authenticated;
grant  execute on function public.directeur_etudes_substitute_session_teacher(uuid,uuid,uuid,text) to authenticated;
