-- =============================================================================
-- Lot Finance F4 (renfort atomicité) — RPC materialize_student_finance
-- -----------------------------------------------------------------------------
-- Matérialise, en UNE SEULE transaction DB, la finance d'un étudiant à partir du
-- SNAPSHOT figé (admission_packs.schedule_json) :
--   • valide les paramètres reçus ;
--   • upsert student_finance (tuition_due = tarif OFFICIEL, discount_rate porte
--     la remise, total_due = registration_fee + tuition_net) ;
--   • supprime l'échéancier existant du student_id ;
--   • insère les N lignes payment_schedules ;
--   • vérifie en fin de transaction : nb lignes attendu + somme = tuition_net ;
--   • toute étape en échec ⇒ rollback complet (exception).
--
-- Idempotent : delete+insert → 10 (échelonné) / 1 (comptant), jamais de doublon.
-- Sécurité : SECURITY DEFINER, search_path='', EXECUTE réservé à service_role.
-- Ne recalcule JAMAIS la scolarité depuis tuition_levels : n'écrit que le figé.
-- =============================================================================

create or replace function public.materialize_student_finance(
  p_student          uuid,
  p_academic_year    text,
  p_level            text,
  p_registration_fee numeric,
  p_tuition_official numeric,
  p_discount_rate    numeric,
  p_tuition_net      numeric,
  p_payment_option   text,
  p_installments     jsonb,
  p_mode             text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected int;
  v_total    numeric;
  v_nb       int;
  v_sum      numeric;
  r          jsonb;
begin
  -- 1. Validation stricte des paramètres.
  if p_student is null then
    raise exception 'materialize_student_finance: student manquant';
  end if;
  if not exists (select 1 from public.profiles where id = p_student) then
    raise exception 'materialize_student_finance: profil introuvable (%)', p_student;
  end if;
  if p_tuition_official is null or p_tuition_official <= 0 then
    raise exception 'materialize_student_finance: tarif officiel invalide (%)', p_tuition_official;
  end if;
  if p_tuition_net is null or p_tuition_net <= 0 then
    raise exception 'materialize_student_finance: scolarité nette invalide (%)', p_tuition_net;
  end if;
  if p_registration_fee is null or p_registration_fee < 0 then
    raise exception 'materialize_student_finance: frais d''inscription invalides (%)', p_registration_fee;
  end if;
  if p_discount_rate is null or p_discount_rate < 0 or p_discount_rate >= 1 then
    raise exception 'materialize_student_finance: remise incohérente (%)', p_discount_rate;
  end if;
  if p_payment_option is null or p_payment_option not in ('echelonne', 'comptant') then
    raise exception 'materialize_student_finance: mode de paiement inconnu (%)', p_payment_option;
  end if;
  if p_installments is null
     or jsonb_typeof(p_installments) <> 'array'
     or jsonb_array_length(p_installments) = 0 then
    raise exception 'materialize_student_finance: échéancier vide';
  end if;

  v_expected := case p_payment_option when 'comptant' then 1 else 10 end;
  if jsonb_array_length(p_installments) <> v_expected then
    raise exception 'materialize_student_finance: nb tranches attendu % obtenu %',
      v_expected, jsonb_array_length(p_installments);
  end if;

  v_total := p_registration_fee + p_tuition_net;

  -- 2. Upsert student_finance (tuition_due = OFFICIEL ; remise via discount_rate).
  insert into public.student_finance as sf (
    student_id, registration_fee, tuition_due, discount_rate, level,
    academic_year, total_due, installments, mode, access_state, updated_at
  ) values (
    p_student, p_registration_fee, p_tuition_official, p_discount_rate, nullif(p_level, ''),
    nullif(p_academic_year, ''), v_total, v_expected, nullif(p_mode, ''), 'pause', now()
  )
  on conflict (student_id) do update set
    registration_fee = excluded.registration_fee,
    tuition_due      = excluded.tuition_due,
    discount_rate    = excluded.discount_rate,
    level            = excluded.level,
    academic_year    = excluded.academic_year,
    total_due        = excluded.total_due,
    installments     = excluded.installments,
    mode             = coalesce(excluded.mode, sf.mode),
    access_state     = 'pause',
    updated_at       = now();

  -- 3. Échéancier : delete strict puis insert (idempotent).
  delete from public.payment_schedules where student_id = p_student;

  for r in select * from jsonb_array_elements(p_installments) loop
    if (r->>'amount') is null or (r->>'amount')::numeric <= 0 then
      raise exception 'materialize_student_finance: montant de tranche invalide';
    end if;
    if (r->>'due_date') is null then
      raise exception 'materialize_student_finance: date de tranche manquante';
    end if;
    insert into public.payment_schedules (student_id, label, amount, due_date)
    values (
      p_student,
      case p_payment_option
        when 'comptant' then 'Scolarité (comptant)'
        else 'Tranche ' || (r->>'seq') || '/' || v_expected
      end,
      (r->>'amount')::numeric,
      (r->>'due_date')::date
    );
  end loop;

  -- 4. Vérification finale (même transaction) : nb + somme = tuition_net.
  select count(*), coalesce(sum(amount), 0)
    into v_nb, v_sum
    from public.payment_schedules
   where student_id = p_student;

  if v_nb <> v_expected then
    raise exception 'materialize_student_finance: vérif nb=% attendu=%', v_nb, v_expected;
  end if;
  if v_sum <> p_tuition_net then
    raise exception 'materialize_student_finance: vérif somme=% <> net=%', v_sum, p_tuition_net;
  end if;

  return jsonb_build_object(
    'nb', v_nb,
    'sum', v_sum,
    'total_due', v_total,
    'tuition_due', p_tuition_official,
    'discount_rate', p_discount_rate
  );
end;
$$;

-- Permissions : uniquement service_role (+ owner). Jamais public/anon/authenticated.
revoke all on function public.materialize_student_finance(
  uuid, text, text, numeric, numeric, numeric, numeric, text, jsonb, text
) from public;
revoke all on function public.materialize_student_finance(
  uuid, text, text, numeric, numeric, numeric, numeric, text, jsonb, text
) from anon;
revoke all on function public.materialize_student_finance(
  uuid, text, text, numeric, numeric, numeric, numeric, text, jsonb, text
) from authenticated;
grant execute on function public.materialize_student_finance(
  uuid, text, text, numeric, numeric, numeric, numeric, text, jsonb, text
) to service_role;
