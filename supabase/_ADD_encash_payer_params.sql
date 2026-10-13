-- ─────────────────────────────────────────────────────────────────────────
-- Étend encash_payment_proof (W4) avec le PAYEUR + détails techniques, pour que
-- l'encaissement capture les MÊMES informations que la saisie manuelle.
-- Mêmes gardes (G1-G6), même logique atomique. Nouveaux params DEFAULT NULL.
-- On supprime l'ancienne signature 5-args pour éviter toute ambiguïté d'overload.
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.encash_payment_proof(uuid, numeric, text, text, date);

create or replace function public.encash_payment_proof(
  p_proof_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_paid_at date default current_date,
  p_payer_name text default null,
  p_payer_relationship text default null,
  p_payer_email text default null,
  p_payer_phone text default null,
  p_cheque_drawer text default null,
  p_cheque_bank text default null,
  p_cheque_number text default null,
  p_wave_payer_number text default null,
  p_wave_transaction_id text default null,
  p_wave_merchant text default null
) returns uuid
  language plpgsql
  security definer
  set search_path to ''
as $function$
declare
  v_role  public.user_role;
  v_proof public.payment_proofs;
  v_pid   uuid;
begin
  v_role := public.current_user_role();
  if v_role is null or v_role not in
     ('super_admin'::public.user_role, 'admin'::public.user_role)
  then raise exception 'NON_AUTORISE'; end if;

  if p_amount is null or p_amount <= 0 then raise exception 'MONTANT_INVALIDE'; end if;

  select * into v_proof from public.payment_proofs where id = p_proof_id for update;
  if not found then raise exception 'PREUVE_INTROUVABLE'; end if;
  if v_proof.status <> 'valide' then raise exception 'PREUVE_NON_VALIDE'; end if;
  if v_proof.kind <> 'inscription' then raise exception 'KIND_NON_SUPPORTE'; end if;
  if v_proof.payment_id is not null then raise exception 'DEJA_ENCAISSEE'; end if;

  insert into public.payments
    (student_id, candidature_id, amount, kind, status, method, reference, paid_at, recorded_by,
     payer_name, payer_relationship, payer_email, payer_phone,
     cheque_drawer, cheque_bank, cheque_number,
     wave_payer_number, wave_transaction_id, wave_merchant)
  values
    (null, v_proof.candidature_id, p_amount, 'inscription', 'paye',
     p_method, p_reference, coalesce(p_paid_at, current_date), auth.uid(),
     p_payer_name, p_payer_relationship, p_payer_email, p_payer_phone,
     p_cheque_drawer, p_cheque_bank, p_cheque_number,
     p_wave_payer_number, p_wave_transaction_id, p_wave_merchant)
  returning id into v_pid;

  update public.payment_proofs set payment_id = v_pid
    where id = p_proof_id and payment_id is null;
  if not found then raise exception 'DEJA_ENCAISSEE_CONCURRENT'; end if;

  return v_pid;
end;
$function$;

revoke all on function public.encash_payment_proof(uuid,numeric,text,text,date,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.encash_payment_proof(uuid,numeric,text,text,date,text,text,text,text,text,text,text,text,text,text) to authenticated, service_role;
