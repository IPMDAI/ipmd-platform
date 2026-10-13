-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot Finance F1 : fondation échéancier (gabarit unique). REVUE — feu vert requis.
-- Portée STRICTE : table installment_plan + garde 100%/an + RLS + seed 2026-2027
-- + correction tuition_levels Licence 3 (2 500 000 -> 2 550 000).
-- Montants JAMAIS stockés ici (calculés tuition_levels × pct).
-- Ne touche NI payment_schedules NI student_finance NI matricule NI MODE TEST
-- NI pack/emails/PDF/Wave NI bourses.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Gabarit unique (académique_year, seq, pct, due_date) — aucun montant
create table if not exists public.installment_plan (
  academic_year text not null,
  seq  int  not null check (seq between 1 and 10),
  pct  numeric not null check (pct > 0 and pct <= 100),
  due_date date not null,
  primary key (academic_year, seq)
);

-- 2) Garde : somme(pct) = 100 par année (trigger contrainte DÉFÉRÉ → vérifié au commit)
create or replace function public.installment_plan_check_sum()
returns trigger language plpgsql
set search_path = ''
as $fn$
declare y text; s numeric;
begin
  y := coalesce(new.academic_year, old.academic_year);
  select coalesce(sum(pct),0) into s from public.installment_plan where academic_year = y;
  -- s = 0 autorisé (année entièrement vidée) ; sinon doit valoir exactement 100
  if s <> 0 and s <> 100 then
    raise exception 'installment_plan: somme des pct pour % = % (doit etre 100)', y, s;
  end if;
  return null;
end
$fn$;

drop trigger if exists installment_plan_sum_trg on public.installment_plan;
create constraint trigger installment_plan_sum_trg
  after insert or update or delete on public.installment_plan
  deferrable initially deferred
  for each row execute function public.installment_plan_check_sum();

-- 3) RLS : lecture publique (grille /scolarite + pack), écriture admin uniquement
alter table public.installment_plan enable row level security;

drop policy if exists "installment_plan public read" on public.installment_plan;
create policy "installment_plan public read" on public.installment_plan
  for select using (true);

drop policy if exists "installment_plan admin write" on public.installment_plan;
create policy "installment_plan admin write" on public.installment_plan
  for all
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

-- 4) Seed 2026-2027 (T1 Campus confirmée = 20/10/2026)
insert into public.installment_plan(academic_year, seq, pct, due_date) values
 ('2026-2027', 1,15,'2026-10-20'),
 ('2026-2027', 2,15,'2026-11-20'),
 ('2026-2027', 3,15,'2026-12-20'),
 ('2026-2027', 4,10,'2027-01-20'),
 ('2026-2027', 5,10,'2027-02-20'),
 ('2026-2027', 6,10,'2027-03-20'),
 ('2026-2027', 7,10,'2027-04-20'),
 ('2026-2027', 8, 5,'2027-05-20'),
 ('2026-2027', 9, 5,'2027-06-20'),
 ('2026-2027',10, 5,'2027-07-20')
on conflict (academic_year, seq) do nothing;

-- 5) Correction tarif Licence 3
update public.tuition_levels set amount = 2550000 where level = 'Licence 3';

-- ------------------------------------------------------------------ CONTRÔLES
do $$ declare n int; s numeric; begin
  select count(*), coalesce(sum(pct),0) into n, s from public.installment_plan where academic_year='2026-2027';
  if n <> 10 then raise exception 'CTRL: %/10 tranches 2026-2027', n; end if;
  if s <> 100 then raise exception 'CTRL: somme pct = %/100', s; end if;
  if (select amount from public.tuition_levels where level='Licence 3') <> 2550000 then raise exception 'CTRL: L3 != 2550000'; end if;
  raise notice 'OK F1 — installment_plan (10 tranches, 100%%), L3=2 550 000.';
end $$;

commit;
