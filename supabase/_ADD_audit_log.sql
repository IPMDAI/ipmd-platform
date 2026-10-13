-- D3 — Journal d'activité / Audit général (append-only, immuable).

-- 1) Table (sans FK : un log survit à la suppression d'un profil ; historique
--    jamais couplé à un cascade).
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id    uuid,
  actor_role  public.user_role,
  action_type text not null check (action_type in ('create','update','validate','cancel','archive','delete')),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  student_id  uuid,
  class_id    uuid,
  module_id   uuid,
  teacher_id  uuid,
  old_value   jsonb,
  new_value   jsonb,
  reason      text,
  summary     text
);
create index if not exists audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index if not exists audit_log_actor_idx     on public.audit_log (actor_id);
create index if not exists audit_log_student_idx    on public.audit_log (student_id);
create index if not exists audit_log_entity_idx     on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_action_idx     on public.audit_log (action_type);

-- 2) Immutabilité append-only : RLS lecture super_admin ; AUCUNE policy
--    insert/update/delete ; trigger qui bloque UPDATE/DELETE pour TOUS (y
--    compris table owner / service_role) ; REVOKE des droits SQL.
alter table public.audit_log enable row level security;

drop policy if exists "audit super_admin read" on public.audit_log;
create policy "audit super_admin read" on public.audit_log
  for select using (public.current_user_role() = 'super_admin'::public.user_role);

revoke insert, update, delete on public.audit_log from anon, authenticated;

create or replace function public.guard_audit_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log est append-only : ni modification ni suppression (%).', TG_OP;
end $$;

drop trigger if exists guard_audit_append_only on public.audit_log;
create trigger guard_audit_append_only
  before update or delete on public.audit_log
  for each row execute function public.guard_audit_append_only();

-- 3) Helper d'audit explicite (SECURITY DEFINER) — pour les RPC (ex. D4 notes).
--    L'acteur et le rôle sont fixés côté serveur (auth.uid()), non usurpables.
create or replace function public.log_audit(
  p_action_type text, p_action text, p_entity_type text,
  p_entity_id uuid default null, p_student_id uuid default null,
  p_class_id uuid default null, p_module_id uuid default null,
  p_teacher_id uuid default null, p_old jsonb default null,
  p_new jsonb default null, p_reason text default null, p_summary text default null
) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  insert into public.audit_log(actor_id,actor_role,action_type,action,entity_type,
    entity_id,student_id,class_id,module_id,teacher_id,old_value,new_value,reason,summary)
  values (auth.uid(), public.current_user_role(), p_action_type, p_action, p_entity_type,
    p_entity_id, p_student_id, p_class_id, p_module_id, p_teacher_id, p_old, p_new, p_reason, p_summary)
  returning id into v_id;
  return v_id;
end $$;

-- 4) Trigger d'audit générique (SECURITY DEFINER → écrit dans audit_log en
--    bypassant la RLS). AFTER → même transaction que l'action : si le log
--    échoue, l'action échoue aussi (atomicité). Extraction optionnelle des
--    colonnes de contexte (clé absente = null, jamais d'erreur).
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare j_old jsonb; j_new jsonb;
begin
  j_old := case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end;
  j_new := case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end;
  insert into public.audit_log(actor_id,actor_role,action_type,action,entity_type,
    entity_id,student_id,class_id,module_id,teacher_id,old_value,new_value,summary)
  values (
    auth.uid(), public.current_user_role(),
    case TG_OP when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME,
    nullif(coalesce(j_new->>'id', j_old->>'id'),'')::uuid,
    nullif(coalesce(j_new->>'student_id', j_old->>'student_id'),'')::uuid,
    nullif(coalesce(j_new->>'class_id', j_old->>'class_id'),'')::uuid,
    nullif(coalesce(j_new->>'module_id', j_old->>'module_id'),'')::uuid,
    nullif(coalesce(j_new->>'teacher_id', j_old->>'teacher_id'),'')::uuid,
    j_old, j_new, TG_TABLE_NAME || ' ' || lower(TG_OP)
  );
  return null;
end $$;

-- 5) Branchement sur les actions académiques critiques (preuve du mécanisme).
do $$
declare t text;
  tables text[] := array['timetable_slots','course_sessions','session_attendance','convocations','student_documents'];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
end $$;
