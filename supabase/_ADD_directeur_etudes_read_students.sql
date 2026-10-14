-- Correctif (lacune D2) : le Directeur des Études doit pouvoir LIRE les profils
-- nécessaires au suivi académique (annuaire étudiants). D2 avait ouvert les
-- PAGES mais pas la lecture des profils → annuaire vide.
-- MOINDRE PRIVILÈGE : uniquement etudiant + enseignant. PAS les parents
-- (administration des parents hors périmètre DÉ — à ouvrir précisément si un
-- besoin pédagogique l'exige), PAS les comptes admin/super/staff (rôles/RH),
-- PAS de donnée financière (aucune table finance ouverte). Lecture seule.

drop policy if exists "DE read people profiles" on public.profiles;
drop policy if exists "DE read profiles" on public.profiles;
create policy "DE read people profiles" on public.profiles
  for select using (
    public.current_user_role() = 'directeur_etudes'::public.user_role
    and role in (
      'etudiant'::public.user_role,
      'enseignant'::public.user_role
    )
  );

drop policy if exists "DE read class members" on public.class_members;
create policy "DE read class members" on public.class_members
  for select using (
    public.current_user_role() = 'directeur_etudes'::public.user_role
  );
