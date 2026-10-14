-- D5 (option C) — Source de vérité UNIQUE du « standing » financier, calculée à
-- la lecture (jamais stockée → jamais périmée). Reproduit EXACTEMENT la règle de
-- computeSchedule/computeFinance (TS) : imputation cumulative des paiements
-- scolarité (status validé, hors inscription) sur les échéances triées par date.
-- Retourne SEULEMENT un label : a_jour / en_retard / acces_en_pause. Aucun montant.

create or replace function public.student_financial_standing(p_student uuid)
returns text
language plpgsql security definer set search_path to 'public' stable as $$
declare v_access text; v_paid numeric; v_due numeric;
begin
  -- Priorité 0 : dossier financier ABSENT → état explicite « à vérifier ».
  -- On ne renvoie JAMAIS « à jour » par défaut quand la donnée manque.
  select access_state into v_access from public.student_finance where student_id = p_student;
  if not found then
    return 'a_verifier';
  end if;
  -- Priorité 1 : accès officiel (pause = inscription non soldée ; bloque = blocage manuel).
  if v_access in ('pause', 'bloque') then
    return 'acces_en_pause';
  end if;

  -- Paiements SCOLARITÉ validés (status null = historique payé ; exclut l'inscription).
  select coalesce(sum(amount), 0) into v_paid
  from public.payments
  where student_id = p_student
    and (status is null or status = 'paye')
    and coalesce(kind, '') <> 'inscription';

  -- Σ des échéances ARRIVÉES (due_date <= aujourd'hui). En retard ssi la couverture
  -- cumulée ne suffit pas à couvrir tout ce qui est dû à ce jour (équiv. exact :
  -- il existe une échéance arrivée dont le cumul dépasse le payé).
  select coalesce(sum(amount), 0) into v_due
  from public.payment_schedules
  where student_id = p_student
    and due_date <= current_date;

  if v_paid < v_due then
    return 'en_retard';
  end if;
  return 'a_jour';
end $$;

-- La fonction n'est appelable QUE par la RPC (qui s'exécute en tant que owner) :
-- aucun rôle applicatif ne peut l'invoquer directement.
revoke execute on function public.student_financial_standing(uuid)
  from public, anon, authenticated, service_role;

-- La RPC d'annuaire expose le standing. Toujours réservée à directeur_etudes /
-- admin / super_admin ; jamais de montant. Part des IDS DEMANDÉS (unnest) → la
-- BASE renvoie un standing pour CHAQUE étudiant demandé, y compris sans dossier
-- financier (student_financial_standing → 'a_verifier'). La page n'appelant la
-- RPC qu'avec les ~25 ids affichés, c'est rapide quel que soit l'effectif total.
drop function if exists public.students_access_states(uuid[]);
create or replace function public.students_access_states(p_ids uuid[])
returns table(student_id uuid, standing text, academic_year text)
language sql security definer set search_path to 'public' stable as $$
  select pid,
         public.student_financial_standing(pid),
         (select sf.academic_year from public.student_finance sf where sf.student_id = pid)
  from unnest(p_ids) as pid
  where public.current_user_role() in (
    'directeur_etudes'::public.user_role,
    'admin'::public.user_role,
    'super_admin'::public.user_role
  );
$$;

revoke execute on function public.students_access_states(uuid[]) from public, anon;
grant execute on function public.students_access_states(uuid[]) to authenticated;
