-- D3 (durcissement immutabilité) — suite à la revue : fermer les contournements.
-- Règle : une entrée audit_log ne doit JAMAIS pouvoir être UPDATE/DELETE/TRUNCATE
-- par un utilisateur, le service_role, ou une fonction SECURITY DEFINER.
-- Seul un superuser peut encore contourner en DÉSACTIVANT explicitement le
-- trigger (DDL) — règle opérationnelle : NE JAMAIS le désactiver.

-- 1) Révoquer les privilèges d'écriture destructive à TOUS les rôles applicatifs.
revoke insert, update, delete, truncate on public.audit_log
  from anon, authenticated, service_role, public;

-- 2) Bloquer TRUNCATE (les triggers FOR EACH ROW ne se déclenchent PAS sur
--    TRUNCATE → faille comblée par un trigger de statement dédié).
create or replace function public.guard_audit_no_truncate()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log est append-only : TRUNCATE interdit.';
end $$;

drop trigger if exists guard_audit_no_truncate on public.audit_log;
create trigger guard_audit_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.guard_audit_no_truncate();

-- Rappel : guard_audit_append_only (BEFORE UPDATE OR DELETE, FOR EACH ROW) +
-- RLS (SELECT super_admin uniquement, aucune policy write) complètent le verrou.
