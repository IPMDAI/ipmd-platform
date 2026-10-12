-- ─────────────────────────────────────────────────────────────────────────
-- Additif : colonne heures_stage (stage en entreprise, hors heures campus)
-- + extension garde-fou credits + securite statut reserve au niveau DB.
-- Backward-compatible : les modules existants (L1/L2/L3-S5) obtiennent 0.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Colonne heures_stage : integer, NOT NULL, defaut 0, CHECK >= 0.
alter table public.modules add column if not exists heures_stage integer not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'modules_heures_stage_chk') then
    alter table public.modules add constraint modules_heures_stage_chk check (heures_stage >= 0);
  end if;
end $$;

-- 2) Garde-fou credits etendu : charge_module = cours+td+tp+projet+STAGE.
--    (travail_personnel = credits*25 - charge_module reste calcule cote app.)
create or replace function public.modules_credit_guard() returns trigger language plpgsql as $fn$
declare f numeric; prog int;
begin
  if NEW.credits is null then return NEW; end if;
  select hours_per_credit into f from public.academic_year_config where academic_year = NEW.academic_year;
  if f is null then return NEW; end if;
  prog := coalesce(NEW.heures_cours,0)+coalesce(NEW.heures_td,0)+coalesce(NEW.heures_tp,0)
          +coalesce(NEW.heures_projet,0)+coalesce(NEW.heures_stage,0);
  if NEW.credits * f < prog then
    raise exception 'GARDE_FOU : % credits x % h = % h < % h programmees (module %)',
      NEW.credits, f, NEW.credits*f, prog, NEW.name;
  end if;
  return NEW;
end $fn$;

-- 3) Securite : 'reserve' reservee au super_admin AUSSI en base (defense en
--    profondeur). On n'enleve aucune protection existante.
create or replace function public.guard_academic_status() returns trigger language plpgsql as $fn$
begin
  if public.current_user_role() is distinct from 'super_admin'
     and NEW.status is distinct from OLD.status
     and NEW.status in ('valide','actif','refuse','archive','reserve') then
    NEW.status := OLD.status; -- ignore la tentative
  end if;
  return NEW;
end $fn$;
