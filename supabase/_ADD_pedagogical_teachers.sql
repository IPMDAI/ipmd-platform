-- =============================================================================
-- D7-1 — Annuaire pédagogique SÉCURISÉ (lecture seule)
-- =============================================================================
-- Le DÉ (et admin/super/pedagogie) doit voir l'identité PÉDAGOGIQUE des
-- enseignants pour piloter la charge — SANS exposer la table teacher_profiles
-- (qui contient aussi des données RH/personnelles : naissance, pièce d'identité,
-- contacts d'urgence, résidence…). La RLS protège les lignes, pas les colonnes.
-- → RPC de LECTURE SECURITY DEFINER qui ne renvoie QUE les champs pédagogiques :
--   profile_id, nom complet, fonction, spécialité, statut pédagogique, autorisation.
-- JAMAIS : naissance / pièce / contacts d'urgence / paie / données RH / privé.
--
-- Périmètre : enseignants (role=enseignant) + un directeur_etudes QUI ENSEIGNE
-- (role=directeur_etudes AVEC une fiche teacher_profiles — même compte, jamais
-- un 2e). Réservée aux rôles de pilotage. Cette RPC est aussi la source du futur
-- écran « Enseignants & charge » et de l'éligibilité D7-2.
-- Statuts réels (src/lib/teacher.ts) : en_attente / valide / actif / inactif /
-- archive. « Autorisé/actif » = statut ∈ {valide, actif} (vérifié, non deviné).
-- =============================================================================

create or replace function public.pedagogical_teachers()
returns table(
  profile_id   uuid,
  full_name    text,
  fonction     text,   -- teacher_profiles.function (libellé pédagogique)
  specialite   text,   -- teacher_profiles.specialty
  statut       text,   -- teacher_profiles.status (en_attente/valide/actif/inactif/archive)
  autorisation text    -- teacher_profiles.authorization (texte libre)
)
language sql security definer set search_path to 'public' stable as $$
  select p.id,
         p.full_name,
         tp.function,
         tp.specialty,
         coalesce(tp.status, 'en_attente'),
         tp.authorization
  from public.profiles p
  left join public.teacher_profiles tp on tp.teacher_id = p.id
  where public.current_user_role() in (
          'directeur_etudes'::public.user_role,
          'admin'::public.user_role,
          'super_admin'::public.user_role,
          'pedagogie'::public.user_role
        )
    and (
      p.role = 'enseignant'::public.user_role
      or (p.role = 'directeur_etudes'::public.user_role and tp.teacher_id is not null)
    )
  order by p.full_name nulls last, p.id;
$$;

revoke execute on function public.pedagogical_teachers() from public, anon;
grant  execute on function public.pedagogical_teachers() to authenticated;
