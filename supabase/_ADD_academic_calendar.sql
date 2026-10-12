-- ─────────────────────────────────────────────────────────────────────────
-- B2 : calendrier académique versionné (jalons/périodes), type-aware.
-- blocks_regular=true → suspend les types réguliers (cours/td/tp) ; les séances
-- type examen/soutenance restent programmables. Dates ajustables plus tard
-- sans changer le schéma.
-- ─────────────────────────────────────────────────────────────────────────
begin;

create table if not exists public.academic_calendar (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null,
  kind text not null check (kind in (
    'rentree','examens_s1','examens_s2','presentations','soutenances',
    'vacances','stage_l2','stage_l3','hackathon','journee_ipmd'
  )),
  label text not null,
  start_date date not null,
  end_date date not null,
  level text,
  blocks_regular boolean not null default false,
  note text,
  created_at timestamptz default now(),
  constraint ac_dates check (end_date >= start_date)
);

alter table public.academic_calendar enable row level security;
drop policy if exists "read calendar" on public.academic_calendar;
create policy "read calendar" on public.academic_calendar for select using (true);
drop policy if exists "staff manage calendar" on public.academic_calendar;
create policy "staff manage calendar" on public.academic_calendar for all
  using ((current_user_role())::text = any (array['admin','super_admin','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','pedagogie']));

-- Jalons 2026-2027 datés (5). Aucun jalon de stage daté (défini avec L2/L3).
insert into public.academic_calendar(academic_year,kind,label,start_date,end_date,level,blocks_regular,note) values
 ('2026-2027','rentree','Rentrée','2026-10-01','2026-10-01',null,false,null),
 ('2026-2027','examens_s1','Examens écrits S1','2027-02-08','2027-02-19',null,true,'Cours réguliers suspendus ; séances type examen autorisées'),
 ('2026-2027','presentations','Présentation des projets','2027-06-01','2027-06-30',null,false,'Fenêtre large ; dates précises avec les plannings'),
 ('2026-2027','soutenances','Soutenances L3/M2','2027-07-01','2027-07-31',null,false,'L3 et M2'),
 ('2026-2027','vacances','Vacances','2027-08-01','2027-09-30',null,true,'Fermeture pédagogique (fin provisoire avant rentrée) ; exception admin possible');

commit;
