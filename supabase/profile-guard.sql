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
