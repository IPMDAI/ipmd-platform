-- ══════════════════════════════════════════════════════════════
-- IPMD — Préparation EN LOT des réinscriptions (admin), transactionnelle.
-- PROPOSITION — non appliquée. Crée des lignes reenrollments en 'prepared'
-- UNIQUEMENT pour les étudiants éligibles ; renvoie un rapport détaillé.
--
-- Ne corrige jamais filiere_id, ne crée rien pour M2/fin de cycle ni pour les
-- classes source sans filière, ne touche ni class_members ni student_finance.
-- Snapshot financier figé dans reenrollments. Anti-doublon via ON CONFLICT.
-- Une seule transaction ; erreurs isolées par savepoint et comptées.
-- ══════════════════════════════════════════════════════════════

create or replace function public.prepare_reenrollments(
  p_student_ids uuid[],
  p_academic_year text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_role    public.user_role;
  v_src     text;
  v_regfee  numeric;
  sid       uuid;
  cls_id    uuid; cls_level text; cls_fid uuid;
  nextlvl   text;
  tgt_id    uuid; tgt_name text;
  tuition   numeric;
  ins       int;
  outcome   text;
  msg       text;
  details   jsonb := '[]'::jsonb;
  c_created int := 0; c_already int := 0; c_eoc int := 0;
  c_nofil int := 0; c_notgt int := 0; c_special int := 0; c_err int := 0;
begin
  -- Autorisation
  v_role := public.current_user_role();
  if v_role is null or v_role not in
     ('super_admin'::public.user_role,'admin'::public.user_role,'scolarite'::public.user_role) then
    raise exception 'NON_AUTORISE';
  end if;

  -- Année source = année précédant l'année cible (ex. 2026-2027 -> 2025-2026)
  v_src := (split_part(p_academic_year,'-',1)::int - 1)::text || '-' || split_part(p_academic_year,'-',1);
  select registration_fee into v_regfee from public.finance_settings where academic_year = p_academic_year;

  foreach sid in array coalesce(p_student_ids, array[]::uuid[]) loop
    cls_id := null; cls_level := null; cls_fid := null;
    nextlvl := null; tgt_id := null; tgt_name := null; tuition := null;
    outcome := null; msg := null;

    begin  -- savepoint par étudiant : une erreur n'annule pas le lot
      select c.id, c.level, c.filiere_id into cls_id, cls_level, cls_fid
      from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = sid and c.academic_year = v_src
      limit 1;

      if cls_id is null then
        outcome := 'special_case'; msg := 'Aucune classe ' || v_src || ' pour cet étudiant.';
      elsif exists (select 1 from public.reenrollments where student_id = sid and academic_year = p_academic_year) then
        outcome := 'already_prepared';
      else
        nextlvl := case cls_level
          when 'Licence 1' then 'Licence 2' when 'Licence 2' then 'Licence 3'
          when 'Licence 3' then 'Master 1' when 'Master 1' then 'Master 2' else null end;

        if nextlvl is null then
          outcome := 'end_of_cycle'; msg := 'Dernière année de cycle (' || cls_level || ').';
        elsif cls_fid is null then
          outcome := 'missing_filiere'; msg := 'Filière non renseignée sur la classe ' || v_src || '.';
        else
          select id, name into tgt_id, tgt_name
          from public.classes
          where academic_year = p_academic_year and filiere_id = cls_fid and level = nextlvl
          limit 1;

          if tgt_id is null then
            outcome := 'missing_target_class'; msg := 'Aucune classe ' || p_academic_year || ' « ' || nextlvl || ' » pour cette filière.';
          else
            select amount into tuition from public.tuition_levels where level = nextlvl;
            insert into public.reenrollments
              (student_id, academic_year, from_class_id, from_level, to_class_id, to_level,
               registration_fee, tuition_due, discount_rate, total_due, status)
            values
              (sid, p_academic_year, cls_id, cls_level, tgt_id, nextlvl,
               v_regfee, coalesce(tuition,0), 0, coalesce(tuition,0) + coalesce(v_regfee,0), 'prepared')
            on conflict (student_id, academic_year) do nothing;
            get diagnostics ins = row_count;
            outcome := case when ins = 1 then 'created' else 'already_prepared' end;
          end if;
        end if;
      end if;
    exception when others then
      outcome := 'error'; msg := sqlerrm;
    end;

    -- Compteurs
    if    outcome = 'created'              then c_created := c_created + 1;
    elsif outcome = 'already_prepared'     then c_already := c_already + 1;
    elsif outcome = 'end_of_cycle'         then c_eoc     := c_eoc + 1;
    elsif outcome = 'missing_filiere'      then c_nofil   := c_nofil + 1;
    elsif outcome = 'missing_target_class' then c_notgt   := c_notgt + 1;
    elsif outcome = 'special_case'         then c_special := c_special + 1;
    else                                        c_err     := c_err + 1;
    end if;

    details := details || jsonb_build_object(
      'student_id', sid, 'outcome', outcome,
      'to_class_id', case when outcome = 'created' then tgt_id else null end,
      'to_level', case when outcome = 'created' then nextlvl else null end,
      'message', msg);
  end loop;

  return jsonb_build_object(
    'academic_year', p_academic_year,
    'source_year', v_src,
    'counters', jsonb_build_object(
      'created', c_created, 'already_prepared', c_already, 'end_of_cycle', c_eoc,
      'missing_filiere', c_nofil, 'missing_target_class', c_notgt,
      'special_case', c_special, 'errors', c_err),
    'details', details);
end
$fn$;

revoke all on function public.prepare_reenrollments(uuid[], text) from public;
revoke all on function public.prepare_reenrollments(uuid[], text) from anon;
grant execute on function public.prepare_reenrollments(uuid[], text) to authenticated;
