-- ══════════════════════════════════════════════════════════════
-- IPMD — Phase B : confirmation étudiant de la réinscription.
-- PROPOSITION — non appliquée. L'étudiant connecté confirme SA réinscription
-- 'prepared' : accepte règlement + avenant → status 'student_confirmed'.
--
-- ⚠️ AUCUNE validation finale, AUCUNE bascule class_members/student_finance ici
-- (réservées à validate_reenrollment, côté admin). Transaction unique.
-- ══════════════════════════════════════════════════════════════

create or replace function public.confirm_reenrollment(
  p_academic_year text,
  p_reglement_version text,
  p_avenant_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid;
  r public.reenrollments;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'NON_AUTHENTIFIE'; end if;

  -- On ne confirme QUE sa propre réinscription, et seulement si 'prepared'.
  select * into r
  from public.reenrollments
  where student_id = v_uid and academic_year = p_academic_year
  for update;
  if not found then raise exception 'AUCUNE_REINSCRIPTION'; end if;
  if r.status <> 'prepared' then raise exception 'DEJA_TRAITEE'; end if;

  -- Consentement règlement (versionné, par utilisateur)
  insert into public.reglement_acceptances (user_id, version, accepted_at)
  values (v_uid, p_reglement_version, now())
  on conflict (user_id, version) do update set accepted_at = now();

  -- Avenant + passage en 'student_confirmed' (aucune bascule de classe/finance)
  update public.reenrollments
    set status = 'student_confirmed',
        avenant_version = p_avenant_version,
        avenant_accepted_at = now(),
        updated_at = now()
  where id = r.id;

  return jsonb_build_object('id', r.id, 'status', 'student_confirmed');
end
$fn$;

revoke all on function public.confirm_reenrollment(text, text, text) from public;
revoke all on function public.confirm_reenrollment(text, text, text) from anon;
grant execute on function public.confirm_reenrollment(text, text, text) to authenticated;
