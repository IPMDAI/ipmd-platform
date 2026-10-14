-- =============================================================================
-- D6-3 — Sélecteur d'affectation : liste des profils ÉLIGIBLES comme personnel
-- IPMD, pour l'Administrateur Général (admin/super_admin) uniquement.
-- =============================================================================
-- RPC de LECTURE (pas une transition) : nécessaire car il n'existe pas de policy
-- « admin lit tous les profils » (seul super_admin lit large) → sans ça, le
-- sélecteur serait vide pour un AG de rôle `admin`. L'éligibilité reproduit
-- EXACTEMENT celle de staffing_assign : rôle staff OU membre d'une équipe staff.
-- L'UI n'est JAMAIS la seule barrière : staffing_assign revérifie à l'affectation.

create or replace function public.staffing_eligible_profiles()
returns table(id uuid, full_name text, role public.user_role)
language sql security definer set search_path to 'public' stable as $$
  select p.id, p.full_name, p.role
  from public.profiles p
  where public.current_user_role() in ('admin'::public.user_role, 'super_admin'::public.user_role)
    and (
      p.role in ('enseignant'::public.user_role, 'admin'::public.user_role,
                 'super_admin'::public.user_role, 'scolarite'::public.user_role,
                 'pedagogie'::public.user_role, 'directeur_etudes'::public.user_role)
      or exists (select 1 from public.staff_team_members m where m.profile_id = p.id)
    )
  order by p.full_name nulls last, p.id;
$$;

revoke execute on function public.staffing_eligible_profiles() from public, anon;
grant  execute on function public.staffing_eligible_profiles() to authenticated;
