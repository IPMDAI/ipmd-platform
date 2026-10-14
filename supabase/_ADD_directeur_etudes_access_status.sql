-- D5 — Suivi financier RESTREINT pour le Directeur des Études : statut d'accès
-- UNIQUEMENT (actif / pause / bloqué), JAMAIS les montants. Le DÉ n'a aucun
-- SELECT sur student_finance (les montants restent cachés) ; cette RPC expose
-- seulement 3 colonnes non sensibles, et uniquement au staff académique.
create or replace function public.students_access_states(p_ids uuid[])
returns table(student_id uuid, access_state text, academic_year text)
language sql security definer set search_path to 'public' as $$
  select sf.student_id, sf.access_state, sf.academic_year
  from public.student_finance sf
  where sf.student_id = any(p_ids)
    and public.current_user_role() in (
      'directeur_etudes'::public.user_role,
      'admin'::public.user_role,
      'super_admin'::public.user_role
    );
$$;

-- Droits durcis : pas d'exécution par un visiteur anonyme ni par défaut PUBLIC.
-- Seules les sessions authentifiées peuvent appeler ; la clause WHERE ci-dessus
-- (rôle académique) garantit qu'un étudiant/parent connecté ne reçoit rien.
revoke execute on function public.students_access_states(uuid[]) from public, anon;
grant execute on function public.students_access_states(uuid[]) to authenticated;
