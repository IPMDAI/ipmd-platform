-- ─────────────────────────────────────────────────────────────────────────
-- Maquettes versionnées par année — PHASE 2 (finalisation), À APPLIQUER APRÈS
-- la preuve du code (écritures posent academic_year, lectures filtrent).
-- Aucun DEFAULT : une écriture qui oublie l'année ÉCHOUE (NOT NULL) au lieu
-- d'être classée dans la mauvaise année.
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 1) Année obligatoire désormais (le backfill garantit 0 NULL).
alter table public.modules alter column academic_year set not null;

-- 2) Format AAAA-AAAA.
alter table public.modules drop constraint if exists modules_academic_year_fmt;
alter table public.modules add constraint modules_academic_year_fmt
  check (academic_year ~ '^[0-9]{4}-[0-9]{4}$');

-- 3) Unicité d'un module dans la maquette d'une année.
create unique index if not exists modules_maquette_uk
  on public.modules (filiere_id, level, semester, name, academic_year);

-- 4) Index de lecture par année.
create index if not exists modules_year_idx
  on public.modules (academic_year, level, semester, filiere_id);

-- 5) Clonage d'une maquette annuelle (idempotent, n'écrase rien).
create or replace function public.clone_maquette(p_from text, p_to text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if p_from is null or p_to is null or p_from = p_to then
    raise exception 'ANNEES_INVALIDES';
  end if;
  insert into public.modules
    (filiere_id, name, level, semester, teacher_id, hours, coefficient,
     syllabus, objectives, skills, evaluation_methods, status,
     heures_cours, heures_td, heures_tp, heures_projet, academic_year)
  select filiere_id, name, level, semester, teacher_id, hours, coefficient,
     syllabus, objectives, skills, evaluation_methods, status,
     heures_cours, heures_td, heures_tp, heures_projet, p_to
  from public.modules src
  where src.academic_year = p_from
    and not exists (
      select 1 from public.modules t
      where t.academic_year = p_to and t.filiere_id = src.filiere_id
        and t.level = src.level and t.semester = src.semester and t.name = src.name
    );
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.clone_maquette(text, text) from public, anon, authenticated;
grant execute on function public.clone_maquette(text, text) to service_role;

commit;
