-- ─────────────────────────────────────────────────────────────────────────
-- Traçabilité du PAYEUR + détails techniques par moyen, sur public.payments.
-- 100% additif et nullable : les anciens paiements restent intacts (tout NULL),
-- jamais réécrits. Les obligations (Chèque/Wave) sont applicatives (form + action
-- + RPC), PAS en DB, pour ne pas casser les lignes historiques.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists payer_name text,
  add column if not exists payer_relationship text,
  add column if not exists payer_email text,
  add column if not exists payer_phone text,
  add column if not exists cheque_drawer text,
  add column if not exists cheque_bank text,
  add column if not exists cheque_number text,
  add column if not exists wave_payer_number text,
  add column if not exists wave_transaction_id text,
  add column if not exists wave_merchant text;

-- Valeurs autorisées de la qualité du payeur (tolérant NULL -> anciens OK).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payments_payer_relationship_chk') then
    alter table public.payments add constraint payments_payer_relationship_chk
      check (payer_relationship is null or payer_relationship in
        ('etudiant','pere','mere','tuteur','tutrice','entreprise','autre'));
  end if;
end $$;
