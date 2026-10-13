-- ============================================================================
-- Migration : Années académiques + Rentrées (intakes) + Offres + résolution
--             filiere_id + level + academic_year + intake_id
-- REVUE UNIQUEMENT — NE PAS EXÉCUTER TEL QUEL SANS FEU VERT.
--
-- Propriétés : additif, idempotent (re-run = 0 changement), transactionnel,
-- contrôles AVANT/APRÈS (RAISE → rollback), aucune donnée legacy supprimée.
-- classes.intake (text) reste INTACT. Tous les FK en ON DELETE RESTRICT.
-- À exécuter comme UN SEUL lot.
-- ============================================================================

begin;

-- ------------------------------------------------------------------ CONTRÔLES AVANT
do $$
begin
  if not exists (select 1 from finance_settings where id = 1) then
    raise exception 'CONTRÔLE AVANT : finance_settings(id=1) introuvable — abandon';
  end if;
end $$;

-- ============================================================ 1. TABLES

-- Années — cycle de FONCTIONNEMENT (indépendant du recrutement)
create table if not exists academic_years (
  year         text primary key check (year ~ '^[0-9]{4}-[0-9]{4}$'),
  status       text not null default 'preparation'
               check (status in ('preparation','active','archived')),
  created_at   timestamptz not null default now(),
  activated_at timestamptz
);
-- Invariant : une seule année de fonctionnement 'active'
create unique index if not exists academic_years_single_active
  on academic_years (status) where status = 'active';

-- Rentrées — pilotent le RECRUTEMENT (plusieurs 'open' possibles, aucun mois en dur)
create table if not exists intakes (
  id                    uuid primary key default gen_random_uuid(),
  academic_year         text not null references academic_years(year) on delete restrict,
  label                 text not null,               -- ex. libellé libre de rentrée
  start_date            date,                         -- DÉBUT DES COURS (prévu/réel)
  applications_open_at  timestamptz,                  -- planification ouverture candidatures (facultatif)
  applications_close_at timestamptz,                  -- planification fermeture candidatures (facultatif)
  status                text not null default 'preparation'
                        check (status in ('preparation','open','closed','archived')),
  sort_order            int  not null default 0,
  created_at            timestamptz not null default now(),
  constraint intakes_year_label_uq unique (academic_year, label),
  constraint intakes_id_year_uq    unique (id, academic_year),  -- cible des FK composites
  constraint intakes_apps_window_chk
    check (applications_open_at is null or applications_close_at is null
           or applications_open_at <= applications_close_at)
);
create index if not exists intakes_year_status_idx on intakes (academic_year, status);
create index if not exists intakes_open_idx on intakes (status) where status = 'open';

-- Offres réellement proposées (déclaration explicite avant configuration des classes)
create table if not exists intake_offerings (
  id          uuid primary key default gen_random_uuid(),
  intake_id   uuid not null references intakes(id) on delete restrict,   -- pas de CASCADE
  filiere_id  uuid not null references filieres(id) on delete restrict,
  level       text not null,
  status      text not null default 'planned'
              check (status in ('planned','open','closed')),
  created_at  timestamptz not null default now(),
  constraint intake_offerings_uq unique (intake_id, filiere_id, level)
);
create index if not exists intake_offerings_intake_idx on intake_offerings (intake_id);

-- ============================================================ 2. COLONNES

-- classes : rattachement rentrée + unicité de cohorte
alter table classes add column if not exists intake_id uuid references intakes(id) on delete restrict;
create index if not exists classes_intake_id_idx on classes (intake_id);
create unique index if not exists classes_cohorte_unique
  on classes (filiere_id, level, academic_year, intake_id)
  where kind = 'diplome' and filiere_id is not null and intake_id is not null;

-- candidatures : année + rentrée figées au dépôt
alter table inscription_requests add column if not exists academic_year text;
alter table inscription_requests add column if not exists intake_id     uuid;

-- snapshot admission : rentrée figée
alter table admission_packs add column if not exists intake_id uuid;

-- Contraintes de cohérence (idempotentes via garde pg_constraint)
do $$
begin
  -- candidatures : couple cohérent (year,intake) + "les deux ou aucun"
  if not exists (select 1 from pg_constraint where conname='ir_intake_year_fk') then
    alter table inscription_requests
      add constraint ir_intake_year_fk
      foreign key (intake_id, academic_year) references intakes (id, academic_year) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='ir_intake_year_both') then
    alter table inscription_requests
      add constraint ir_intake_year_both
      check ((academic_year is null) = (intake_id is null));
  end if;
  -- snapshot admission : couple cohérent (legacy year sans intake toléré)
  if not exists (select 1 from pg_constraint where conname='ap_intake_year_fk') then
    alter table admission_packs
      add constraint ap_intake_year_fk
      foreign key (intake_id, academic_year) references intakes (id, academic_year) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='ap_intake_year_guard') then
    alter table admission_packs
      add constraint ap_intake_year_guard
      check (intake_id is null or academic_year is not null);
  end if;
end $$;

-- ============================================================ 3. RLS

alter table academic_years   enable row level security;
alter table intakes          enable row level security;
alter table intake_offerings enable row level security;

drop policy if exists "Read academic_years" on academic_years;
create policy "Read academic_years" on academic_years for select to authenticated using (true);
drop policy if exists "Admins manage academic_years" on academic_years;
create policy "Admins manage academic_years" on academic_years for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read intakes" on intakes;
create policy "Read intakes" on intakes for select to authenticated using (true);
drop policy if exists "Public read open intakes" on intakes;
create policy "Public read open intakes" on intakes for select to anon using (status = 'open');
drop policy if exists "Admins manage intakes" on intakes;
create policy "Admins manage intakes" on intakes for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read intake_offerings" on intake_offerings;
create policy "Read intake_offerings" on intake_offerings for select to authenticated using (true);
-- CORRECTION : offre publique visible seulement si offre 'open' ET rentrée parente 'open'
drop policy if exists "Public read open offerings" on intake_offerings;
create policy "Public read open offerings" on intake_offerings for select to anon
  using (
    status = 'open'
    and exists (select 1 from intakes i where i.id = intake_offerings.intake_id and i.status = 'open')
  );
drop policy if exists "Admins manage intake_offerings" on intake_offerings;
create policy "Admins manage intake_offerings" on intake_offerings for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

-- ============================================================ 4. FONCTIONS SÉCURISÉES
-- SECURITY DEFINER + search_path figé + garde de rôle interne + EXECUTE restreint.

create or replace function public.activate_academic_year(p_year text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.current_user_role()::text not in ('admin','super_admin') then
    raise exception 'Accès refusé';
  end if;
  if not exists (select 1 from public.academic_years where year = p_year) then
    raise exception 'Année inconnue : %', p_year;
  end if;
  update public.academic_years set status='archived' where status='active' and year <> p_year;
  update public.academic_years set status='active', activated_at=now() where year = p_year;
  update public.finance_settings set academic_year = p_year, updated_at = now() where id = 1;
end $$;

create or replace function public.open_intake(p_intake_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_open int; v_missing int; v_year text;
begin
  if public.current_user_role()::text not in ('admin','super_admin') then
    raise exception 'Accès refusé';
  end if;
  select academic_year into v_year from public.intakes where id = p_intake_id;
  if v_year is null then raise exception 'Rentrée inconnue.'; end if;

  select count(*) into v_open
  from public.intake_offerings where intake_id = p_intake_id and status = 'open';
  if v_open = 0 then
    raise exception 'Ouverture refusée : aucune formation n''est ouverte pour cette rentrée.';
  end if;

  select count(*) into v_missing
  from public.intake_offerings o
  where o.intake_id = p_intake_id and o.status = 'open'
    and (select count(*) from public.classes c
         where c.filiere_id=o.filiere_id and c.level=o.level
           and c.academic_year=v_year and c.intake_id=p_intake_id and c.kind='diplome') <> 1;
  if v_missing > 0 then
    raise exception 'Ouverture refusée : % offre(s) « open » sans classe unique configurée.', v_missing;
  end if;

  update public.intakes set status='open' where id = p_intake_id;
end $$;

create or replace function public.close_intake(p_intake_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.current_user_role()::text not in ('admin','super_admin') then
    raise exception 'Accès refusé';
  end if;
  update public.intakes set status='closed' where id = p_intake_id;
  -- Ne modifie AUCUNE candidature déjà déposée.
end $$;

-- EXECUTE : retirer à PUBLIC/anon, n'accorder qu'à authenticated (la garde interne
-- rejette tout non-admin). Aucune RPC exploitable par un utilisateur ordinaire.
revoke all on function public.activate_academic_year(text) from public;
revoke all on function public.open_intake(uuid)            from public;
revoke all on function public.close_intake(uuid)           from public;
revoke all on function public.activate_academic_year(text) from anon;
revoke all on function public.open_intake(uuid)            from anon;
revoke all on function public.close_intake(uuid)           from anon;
grant execute on function public.activate_academic_year(text) to authenticated;
grant execute on function public.open_intake(uuid)            to authenticated;
grant execute on function public.close_intake(uuid)           to authenticated;

-- ============================================================ 4bis. TRIGGERS D'INTÉGRITÉ
-- Garantie DB (pas seulement UI) : toute offre 'open' possède EXACTEMENT 1 classe,
-- au moment de l'ouverture ET après.

-- (A) Une intake_offering ne peut être/passer à 'open' sans exactement 1 classe
--     correspondant à (filiere_id, level, academic_year de la rentrée, intake_id).
create or replace function public.trg_offering_requires_class()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_year text; v_count int;
begin
  if new.status = 'open' then
    select academic_year into v_year from public.intakes where id = new.intake_id;
    if v_year is null then
      raise exception 'Offre non ouvrable : rentrée introuvable.';
    end if;
    select count(*) into v_count from public.classes c
      where c.filiere_id = new.filiere_id and c.level = new.level
        and c.academic_year = v_year and c.intake_id = new.intake_id and c.kind = 'diplome';
    if v_count <> 1 then
      raise exception 'Offre non ouvrable : % classe(s) pour (filière, %, %, rentrée) — attendu exactement 1.',
        v_count, new.level, v_year;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists offering_requires_class on intake_offerings;
create trigger offering_requires_class
  before insert or update on intake_offerings
  for each row execute function public.trg_offering_requires_class();

-- (B) Une classe utilisée par une offre OUVERTE ne peut être supprimée, ni voir ses
--     coordonnées (filiere_id/level/academic_year/intake_id/kind) modifiées si cela
--     casse la correspondance. Les autres champs (ex. tuition_amount) restent modifiables.
--     Pour reconfigurer les coordonnées : fermer d'abord l'offre/la rentrée.
create or replace function public.trg_class_protect_open_offering()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_dep int;
begin
  if old.kind = 'diplome' and old.filiere_id is not null and old.intake_id is not null then
    if TG_OP = 'DELETE'
       or new.filiere_id    is distinct from old.filiere_id
       or new.level         is distinct from old.level
       or new.academic_year is distinct from old.academic_year
       or new.intake_id     is distinct from old.intake_id
       or new.kind          is distinct from old.kind then
      select count(*) into v_dep
      from public.intake_offerings o
      join public.intakes i on i.id = o.intake_id
      where o.status = 'open'
        and o.filiere_id = old.filiere_id and o.level = old.level
        and o.intake_id = old.intake_id and i.academic_year = old.academic_year;
      if v_dep > 0 then
        raise exception 'Opération bloquée : classe utilisée par % offre(s) ouverte(s). Fermez d''abord l''offre/la rentrée, puis reconfigurez.',
          v_dep;
      end if;
    end if;
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists class_protect_open_offering on classes;
create trigger class_protect_open_offering
  before update or delete on classes
  for each row execute function public.trg_class_protect_open_offering();

-- ============================================================ 5. BACKFILL (lecture legacy)

-- 2026-2027 au catalogue en 'preparation' (recrutement piloté par les rentrées).
-- ⚠️ AVANT le seed D1 : sinon D1 l'insérerait en 'archived' (année ≠ année active),
-- et le on-conflict-do-nothing figerait ce mauvais statut.
insert into academic_years (year, status) values ('2026-2027','preparation')
on conflict (year) do nothing;

-- Années existantes au catalogue ; le pointeur finance_settings devient 'active'.
-- On EXCLUT 2026-2027 (déjà posé en 'preparation' ci-dessus) pour ne pas l'archiver.
insert into academic_years (year, status)
select distinct c.academic_year,
       case when c.academic_year = (select academic_year from finance_settings where id=1)
            then 'active' else 'archived' end
from classes c
where c.academic_year ~ '^[0-9]{4}-[0-9]{4}$'
  and c.academic_year <> '2026-2027'
on conflict (year) do nothing;

-- Rentrée existante (lue depuis classes.intake) — reste 'preparation' jusqu'à open_intake().
insert into intakes (academic_year, label, status, sort_order)
select distinct c.academic_year, c.intake, 'preparation', 1
from classes c
where c.academic_year = '2026-2027' and c.intake is not null and c.intake !~ '^[0-9]{4}-[0-9]{4}$'
on conflict (academic_year, label) do nothing;

-- Offre correspondante (planned) depuis la classe existante.
insert into intake_offerings (intake_id, filiere_id, level, status)
select i.id, c.filiere_id, c.level, 'planned'
from classes c
join intakes i on i.academic_year = c.academic_year and i.label = c.intake
where c.academic_year = '2026-2027' and c.filiere_id is not null
  and c.intake is not null and c.intake !~ '^[0-9]{4}-[0-9]{4}$'
on conflict (intake_id, filiere_id, level) do nothing;

-- Rattache la classe existante à sa rentrée (classes.intake texte NON modifié).
update classes c
set intake_id = i.id
from intakes i
where c.academic_year = '2026-2027' and c.intake = i.label and i.academic_year = c.academic_year
  and c.intake_id is null and c.intake !~ '^[0-9]{4}-[0-9]{4}$';

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$
declare v int;
begin
  -- Invariant : exactement une année 'active'
  select count(*) into v from academic_years where status='active';
  if v <> 1 then raise exception 'CONTRÔLE APRÈS : % année(s) active (attendu 1) — rollback', v; end if;

  -- Backfill : la/les classe(s) 2026-2027 à intake textuel « rentrée » sont rattachées
  select count(*) into v
  from classes c
  where c.academic_year='2026-2027' and c.intake is not null
    and c.intake !~ '^[0-9]{4}-[0-9]{4}$' and c.filiere_id is not null and c.intake_id is null;
  if v <> 0 then raise exception 'CONTRÔLE APRÈS : % classe(s) 2026-2027 non rattachée(s) à une rentrée — rollback', v; end if;

  raise notice 'OK — schéma années/rentrées/offres créé + backfill appliqué (idempotent).';
end $$;

commit;

-- ============================================================================
-- ROLLBACK (NE PAS exécuter avec la migration — bloc de secours, non destructif du legacy)
-- ============================================================================
-- begin;
-- drop trigger if exists class_protect_open_offering on classes;
-- drop function if exists public.trg_class_protect_open_offering();
-- drop trigger if exists offering_requires_class on intake_offerings;
-- drop function if exists public.trg_offering_requires_class();
-- drop function if exists public.close_intake(uuid);
-- drop function if exists public.open_intake(uuid);
-- drop function if exists public.activate_academic_year(text);
-- alter table admission_packs      drop constraint if exists ap_intake_year_guard;
-- alter table admission_packs      drop constraint if exists ap_intake_year_fk;
-- alter table admission_packs      drop column if exists intake_id;
-- alter table inscription_requests drop constraint if exists ir_intake_year_both;
-- alter table inscription_requests drop constraint if exists ir_intake_year_fk;
-- alter table inscription_requests drop column if exists intake_id;
-- alter table inscription_requests drop column if exists academic_year;
-- drop index if exists classes_cohorte_unique;
-- drop index if exists classes_intake_id_idx;
-- alter table classes              drop column if exists intake_id;   -- classes.intake (text) INTACT
-- drop table if exists intake_offerings;
-- drop table if exists intakes;
-- drop table if exists academic_years;
-- commit;
