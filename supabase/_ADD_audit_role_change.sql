-- ============================================================================
-- AUDIT DES CHANGEMENTS DE RÔLE (lot séparé, DB-only)
-- ----------------------------------------------------------------------------
-- Objectif : tracer EXACTEMENT 1 entrée dans audit_log (D3/D3.1) à chaque
-- changement NET de profiles.role. Ne journalise QUE le changement de rôle
-- (pas les autres UPDATE de profiles). Réutilise audit_log (pas de 2e journal).
--
-- Interaction avec guard_profile_role (INCHANGÉ) : ce guard est BEFORE UPDATE
-- et, si l'acteur n'est pas super_admin, REMET NEW.role := OLD.role. Notre
-- trigger est AFTER UPDATE avec WHEN (OLD.role IS DISTINCT FROM NEW.role) :
--   - acteur non super_admin → rôle rétabli → NEW.role = OLD.role → WHEN faux
--     → aucune trace (test 2) ;
--   - acteur super_admin → rôle modifié → WHEN vrai → 1 trace (tests 1/3/4) ;
--   - UPDATE d'un autre champ sans toucher au rôle → WHEN faux → aucune trace
--     (test 5).
-- La trace est immuable (audit_log est append-only : guard_audit_append_only
-- + guard_audit_no_truncate). SECURITY DEFINER pour écrire dans audit_log.
-- ============================================================================

create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_name text; v_email text;
begin
  -- Acteur = l'utilisateur qui effectue le changement (garanti super_admin par
  -- guard_profile_role, puisque sinon NEW.role aurait été rétabli et WHEN serait faux).
  select full_name, email into v_name, v_email from public.profiles where id = auth.uid();

  insert into public.audit_log(
    actor_id, actor_role, actor_name, actor_email,
    action_type, action, entity_type, entity_id,
    old_value, new_value, summary, context_snapshot)
  values (
    auth.uid(), public.current_user_role(), v_name, v_email,
    'update', 'profile.role_change', 'profiles', NEW.id,
    jsonb_build_object('role', OLD.role::text),
    jsonb_build_object('role', NEW.role::text),
    'profile.role_change : '||coalesce(OLD.role::text,'?')||' -> '||coalesce(NEW.role::text,'?'),
    jsonb_strip_nulls(jsonb_build_object(
      'profile_name', NEW.full_name,
      'profile_email', NEW.email)));
  return NEW;
end $$;

drop trigger if exists trg_audit_profile_role on public.profiles;
create trigger trg_audit_profile_role
  after update on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.audit_profile_role_change();
