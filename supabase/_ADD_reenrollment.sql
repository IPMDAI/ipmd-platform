-- ══════════════════════════════════════════════════════════════
-- IPMD — Réinscription annuelle (historisé, non destructif).
-- PROPOSITION — non appliquée. 3 tables + backfill 2025-2026 idempotent +
-- RPC transactionnelle de validation. Ne modifie jamais l'historique existant.
-- État actif courant (class_members UNIQUE(student_id), student_finance PK
-- student_id) mis à jour UNIQUEMENT à la validation ; les valeurs antérieures
-- sont préservées dans les tables historisées.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Appartenance de classe historisée ────────────────────────
create table if not exists public.class_enrollments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete restrict,
  academic_year text not null,
  class_id      uuid not null references public.classes(id) on delete restrict,
  level         text,
  filiere_id    uuid references public.filieres(id),
  status        text not null default 'active'
                  check (status in ('active','completed','withdrawn')),
  created_at    timestamptz not null default now(),
  unique (student_id, academic_year)
);
create index if not exists class_enrollments_student_idx on public.class_enrollments (student_id);

-- ── 2. Finance historisée par année ─────────────────────────────
create table if not exists public.student_finance_years (
  student_id       uuid not null references public.profiles(id) on delete restrict,
  academic_year    text not null,
  registration_fee numeric,
  tuition_due      numeric,
  discount_rate    numeric,
  total_due        numeric,
  installments     integer,
  mode             text,
  level            text,
  program          text,
  status           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (student_id, academic_year)
);

-- ── 3. Dossier de réinscription (workflow + audit + snapshot) ────
create table if not exists public.reenrollments (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.profiles(id) on delete restrict,
  academic_year       text not null,
  from_class_id       uuid references public.classes(id),
  to_class_id         uuid references public.classes(id),
  from_level          text,
  to_level            text,
  registration_fee    numeric,
  tuition_due         numeric,
  discount_rate       numeric,
  total_due           numeric,
  installments        integer,
  mode                text,
  reglement_version   text,
  avenant_version     text,
  avenant_accepted_at timestamptz,
  status              text not null default 'prepared'
    check (status in ('prepared','student_confirmed','payment_confirmed',
                      'validated','special_case','cancelled')),
  validated_by        uuid references public.profiles(id),
  validated_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (student_id, academic_year)
);
create index if not exists reenrollments_year_status_idx on public.reenrollments (academic_year, status);

-- ── Lien explicite paiement → réinscription (frais d'inscription rattachés) ──
-- Les paiements historiques restent NULL. ON DELETE RESTRICT : un paiement lié
-- empêche la suppression de la réinscription (préservation de la traçabilité).
alter table public.payments
  add column if not exists reenrollment_id uuid references public.reenrollments(id) on delete restrict;
create index if not exists payments_reenrollment_idx on public.payments (reenrollment_id);

-- ── RLS : lecture admin + lecture de sa propre ligne ; écritures via RPC ──
alter table public.class_enrollments     enable row level security;
alter table public.student_finance_years enable row level security;
alter table public.reenrollments         enable row level security;

do $rls$
declare t text;
begin
  foreach t in array array['class_enrollments','student_finance_years','reenrollments'] loop
    execute format('drop policy if exists "Admins read %1$s" on public.%1$s', t);
    execute format($p$create policy "Admins read %1$s" on public.%1$s for select to authenticated
      using (public.current_user_role() = any (array['super_admin'::public.user_role,'admin'::public.user_role,'scolarite'::public.user_role,'pedagogie'::public.user_role]))$p$, t);
    execute format('drop policy if exists "Student reads own %1$s" on public.%1$s', t);
    execute format($p$create policy "Student reads own %1$s" on public.%1$s for select to authenticated
      using (student_id = auth.uid())$p$, t);
  end loop;
end $rls$;

-- ── Backfill 2025-2026 (et années présentes) — idempotent, NON destructif ──
-- Copie l'état courant vers l'historique. N'écrit QUE dans les nouvelles tables.
-- ⚠️ Bornage aux années HISTORIQUES (≠ 2026-2027) : l'année cible 2026-2027 n'est
-- alimentée QUE par la validation de réinscription, jamais par le backfill.
insert into public.class_enrollments (student_id, academic_year, class_id, level, filiere_id, status)
select cm.student_id, c.academic_year, c.id, c.level, c.filiere_id, 'active'
from public.class_members cm
join public.classes c on c.id = cm.class_id
where c.academic_year is not null and c.academic_year <> '2026-2027'
on conflict (student_id, academic_year) do nothing;

insert into public.student_finance_years
  (student_id, academic_year, registration_fee, tuition_due, discount_rate, total_due, installments, mode, level, program, status)
select sf.student_id, sf.academic_year, sf.registration_fee, sf.tuition_due, sf.discount_rate,
       sf.total_due, sf.installments, sf.mode, sf.level, sf.program, sf.status
from public.student_finance sf
where sf.academic_year is not null and sf.academic_year <> '2026-2027'
on conflict (student_id, academic_year) do nothing;

-- ── RPC de validation (transactionnelle, SECURITY DEFINER) ──────
create or replace function public.validate_reenrollment(p_reenrollment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  r          public.reenrollments;
  v_role     public.user_role;
  v_paid     numeric;
  v_filiere  uuid;
  v_prev_year text;
begin
  v_role := public.current_user_role();
  if v_role is null or v_role not in
     ('super_admin'::public.user_role,'admin'::public.user_role,'scolarite'::public.user_role) then
    raise exception 'NON_AUTORISE';
  end if;

  select * into r from public.reenrollments where id = p_reenrollment_id for update;
  if not found then raise exception 'REENROLLMENT_INTROUVABLE'; end if;
  if r.status = 'validated' then raise exception 'DEJA_VALIDEE'; end if;
  if r.status in ('special_case','cancelled') then raise exception 'HORS_FLUX_NORMAL'; end if;
  if r.to_class_id is null then raise exception 'CLASSE_DESTINATION_MANQUANTE'; end if;
  if r.avenant_accepted_at is null then raise exception 'AVENANT_NON_ACCEPTE'; end if;

  -- Décision #3 : frais d'inscription >= registration_fee snapshot, comptés
  -- UNIQUEMENT sur les paiements explicitement rattachés à CETTE réinscription
  -- (même étudiant, reenrollment_id = cette ligne, kind='inscription').
  select coalesce(sum(p.amount),0) into v_paid
  from public.payments p
  where p.student_id = r.student_id
    and p.reenrollment_id = r.id
    and p.kind = 'inscription';
  if v_paid < coalesce(r.registration_fee,0) then
    raise exception 'FRAIS_INSCRIPTION_INSUFFISANTS';
  end if;

  select filiere_id into v_filiere from public.classes where id = r.to_class_id;

  -- Historique : appartenance + finance de la nouvelle année
  insert into public.class_enrollments (student_id, academic_year, class_id, level, filiere_id, status)
  values (r.student_id, r.academic_year, r.to_class_id, r.to_level, v_filiere, 'active')
  on conflict (student_id, academic_year) do update
    set class_id = excluded.class_id, level = excluded.level,
        filiere_id = excluded.filiere_id, status = 'active';

  insert into public.student_finance_years
    (student_id, academic_year, registration_fee, tuition_due, discount_rate, total_due, installments, mode, level, status)
  values (r.student_id, r.academic_year, r.registration_fee, r.tuition_due, r.discount_rate,
          r.total_due, r.installments, r.mode, r.to_level, 'reinscrit')
  on conflict (student_id, academic_year) do update
    set registration_fee=excluded.registration_fee, tuition_due=excluded.tuition_due,
        discount_rate=excluded.discount_rate, total_due=excluded.total_due,
        installments=excluded.installments, mode=excluded.mode, level=excluded.level,
        status='reinscrit', updated_at=now();

  -- Clôture de l'année précédente dans l'historique
  if r.from_class_id is not null then
    select academic_year into v_prev_year from public.classes where id = r.from_class_id;
    if v_prev_year is not null then
      update public.class_enrollments set status='completed'
      where student_id = r.student_id and academic_year = v_prev_year;
    end if;
  end if;

  -- État actif courant (les valeurs antérieures sont déjà dans l'historique)
  insert into public.class_members (class_id, student_id)
  values (r.to_class_id, r.student_id)
  on conflict (student_id) do update set class_id = excluded.class_id;

  insert into public.student_finance
    (student_id, academic_year, registration_fee, tuition_due, discount_rate, total_due, installments, mode, level, status, updated_at)
  values (r.student_id, r.academic_year, r.registration_fee, r.tuition_due, r.discount_rate,
          r.total_due, r.installments, r.mode, r.to_level, 'reinscrit', now())
  on conflict (student_id) do update
    set academic_year=excluded.academic_year, registration_fee=excluded.registration_fee,
        tuition_due=excluded.tuition_due, discount_rate=excluded.discount_rate,
        total_due=excluded.total_due, installments=excluded.installments, mode=excluded.mode,
        level=excluded.level, status='reinscrit', updated_at=now();

  update public.reenrollments
    set status='validated', validated_by = auth.uid(), validated_at = now(), updated_at = now()
  where id = r.id;

  return r.student_id;
end
$fn$;

revoke all on function public.validate_reenrollment(uuid) from public;
revoke all on function public.validate_reenrollment(uuid) from anon;
grant execute on function public.validate_reenrollment(uuid) to authenticated;
