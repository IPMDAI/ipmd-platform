-- ============================================================================
-- D8-UI-3 : lecture DÉ-safe des jurés internes ÉLIGIBLES (pour le sélecteur UI)
-- ----------------------------------------------------------------------------
-- pedagogical_teachers() (D7-1) inclut des enseignants NON éligibles (profil
-- en_attente / sans teacher_profile). La RLS teacher_profiles exclut le DÉ,
-- donc la page ne peut pas filtrer elle-même. Cette fonction SECURITY DEFINER
-- renvoie EXACTEMENT les profils que is_jury_internal_eligible() accepte, afin
-- que l'UI « ne montre jamais un non-éligible comme juré interne ». Lecture
-- seule, aucune fuite RH (id + nom uniquement). La RPC jury_add_internal reste
-- l'autorité (re-vérifie l'éligibilité). Aucune nouvelle règle métier.
-- ============================================================================
create or replace function public.jury_eligible_internals()
returns table(profile_id uuid, full_name text)
language sql stable security definer set search_path to 'public'
as $$
  select p.id, coalesce(p.full_name, p.email)
  from public.profiles p
  join public.teacher_profiles tp on tp.teacher_id = p.id
  where tp.status in ('valide','actif')
    and p.role in ('enseignant','directeur_etudes','admin','super_admin')
    and public.current_user_role() in ('directeur_etudes','admin','super_admin')
  order by coalesce(p.full_name, p.email) nulls last, p.id;
$$;
revoke all on function public.jury_eligible_internals() from public, anon;
grant execute on function public.jury_eligible_internals() to authenticated;
