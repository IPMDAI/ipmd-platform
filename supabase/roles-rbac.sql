-- ──────────────────────────────────────────────────────────────
-- IPMD — Droits par rôle (RBAC)
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql.
-- Permet aux admins de lire tous les profils et au Super Admin
-- d'attribuer les rôles depuis l'application.
-- ──────────────────────────────────────────────────────────────

-- Lit le rôle de l'utilisateur courant SANS déclencher la RLS
-- (security definer) → évite la récursion infinie dans les policies.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Les admins (super_admin + admin) peuvent lire TOUS les profils.
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

-- Le Super Admin peut modifier n'importe quel profil (attribution des rôles).
drop policy if exists "Super admin updates any profile" on public.profiles;
create policy "Super admin updates any profile"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
