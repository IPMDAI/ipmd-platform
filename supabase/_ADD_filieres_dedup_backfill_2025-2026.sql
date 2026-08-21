-- ============================================================================
-- Migration : dédup filieres (4 doublons) + backfill classes.filiere_id (21 MATCH SÛR)
-- Année active : 2025-2026
-- Généré depuis les données live (dry-run validé). NE PAS ÉDITER À LA MAIN.
--
-- PÉRIMÈTRE STRICT :
--   1. Supprime 4 filières doublons 'en_attente' confirmées à 0 référence.
--   2. Backfill filiere_id sur 21 classes MATCH SÛR uniquement (idempotent).
--   3. NE TOUCHE PAS : classes AMBIGU/GÉNÉRIQUE (restent filiere_id = null).
--   4. NE TOUCHE PAS : le doublon « Licence 3 Marketing Digital » (a73e1f2c…),
--      exclu automatiquement (anti-conflit d'unicité) — audit de références séparé.
--
-- Propriétés : transactionnel (BEGIN/COMMIT), idempotent (re-run = 0 changement),
-- gardes AVANT/APRÈS avec RAISE EXCEPTION → rollback si une correspondance attendue
-- n'est pas unique ou si un conflit d'unicité (filiere_id, level, academic_year) surgirait.
-- À exécuter comme UN SEUL lot (l'exception annule toute la transaction).
-- ============================================================================

begin;

create temporary table _backfill_map (class_id uuid primary key, class_name text not null, filiere_name text not null) on commit drop;
insert into _backfill_map (class_id, class_name, filiere_name) values
  ('3d4976c0-6831-475b-921c-53c9f44ed455','Licence 1 Communication Digitale — 2025-2026','Communication digitale'),
  ('8cbab7d4-28b8-4290-9d8d-2bc935b67e51','Licence 1 Comptabilité et Finance Digitale — 2025-2026','Comptabilité et finance digitale'),
  ('98f27676-33f9-4a38-b516-71fc79f9b87d','Licence 1 E-Commerce et Commerce International — 2025-2026','E-commerce et commerce international'),
  ('c7738e33-aef6-4dd1-b708-f4a6a4687fee','Licence 1 Graphisme et Design — 2025-2026','Graphisme et Design'),
  ('98988893-ad4d-45e7-ba85-d8e3e25694e5','Licence 1 Informatique et Intelligence Artificielle — 2025-2026','Informatique et intelligence artificielle'),
  ('efc2edbd-474a-48d4-8847-457d32fc5b39','Licence 1 Marketing Digital — 2025-2026','Marketing digital'),
  ('ded1e5e8-a65a-4377-a086-04d2d5dbecf2','Licence 2 Communication Digitale — 2025-2026','Communication digitale'),
  ('e6c9181a-2b7c-4ca9-97fd-2322918ce4ea','Licence 2 Comptabilité et Finance Digitale — 2025-2026','Comptabilité et finance digitale'),
  ('4b1003f0-59f7-497d-bf13-fbcc1807e195','Licence 2 E-Commerce et Commerce International — 2025-2026','E-commerce et commerce international'),
  ('b72f027c-b89c-4957-949d-487ac623513f','Licence 2 Graphisme et Design — 2025-2026','Graphisme et Design'),
  ('88337cdb-572c-401f-a1fb-4c16893073af','Licence 2 Informatique et Intelligence Artificielle — 2025-2026','Informatique et intelligence artificielle'),
  ('f7e467b2-b91e-4e1f-95c7-0b9a61eb6fe1','Licence 2 Marketing Digital — 2025-2026','Marketing digital'),
  ('7f273e25-920a-4ec7-8c59-68f982f9f478','Licence 3 Communication Digitale — 2025-2026','Communication digitale'),
  ('fab2a38b-1288-4d9f-bce3-15d22c0394fa','Licence 3 Comptabilité et Finance Digitale — 2025-2026','Comptabilité et finance digitale'),
  ('19cf1911-a544-4150-84ae-080297ecdc8b','Licence 3 E-Commerce et Commerce International — 2025-2026','E-commerce et commerce international'),
  ('8b35ce64-0d83-43b5-be80-b411e73aeaeb','Licence 3 Graphisme et Design — 2025-2026','Graphisme et Design'),
  ('cc679c80-8db8-4180-b827-2955568105c5','Licence 3 Informatique et Intelligence Artificielle — 2025-2026','Informatique et intelligence artificielle'),
  ('5b8e610e-d65a-4bde-b67a-ae7c0b01eb69','Master 1 Management de Projet Digital — 2025-2026','Management de projet digital'),
  ('98ab0a1d-5172-40ea-9393-a51fc04b1c8b','Master 1 Marketing Digital — 2025-2026','Marketing digital'),
  ('ae383ef7-f401-4ed6-b914-905d842bf7e7','Master 2 Management de Projet Digital — 2025-2026','Management de projet digital'),
  ('05f5940e-a9bf-4b40-9587-499524d3ce52','Master 2 Marketing Digital — 2025-2026','Marketing digital');

create temporary table _dup_filieres (filiere_id uuid primary key, filiere_name text not null) on commit drop;
insert into _dup_filieres (filiere_id, filiere_name) values
  ('ae50ca95-c3be-4639-afa5-0cec7ab5bb97','Graphisme & Design'),
  ('4516ccc2-1e91-4e79-9955-2627f1149f24','E-commerce & commerce international'),
  ('9c5c5284-9772-4e4a-80f6-62414e48efb9','Informatique & intelligence artificielle'),
  ('f772338a-773b-4485-8b78-d56a8157d67e','Comptabilité & finance digitale');

-- ---------------- GARDES AVANT ----------------
do $$
declare v int; r record;
begin
  -- 1a. Doublons : s'ils existent encore, doivent porter le même nom ET 0 référence (classes+modules).
  for r in select * from _dup_filieres loop
    if exists (select 1 from filieres where id = r.filiere_id) then
      if not exists (select 1 from filieres where id = r.filiere_id and name = r.filiere_name) then
        raise exception 'GARDE 1a: doublon % (%) renommé depuis le dry-run — rollback', r.filiere_name, r.filiere_id;
      end if;
      select count(*) into v from classes where filiere_id = r.filiere_id;
      if v <> 0 then raise exception 'GARDE 1a: doublon % référencé par % classe(s) — rollback', r.filiere_name, v; end if;
      select count(*) into v from modules where filiere_id = r.filiere_id;
      if v <> 0 then raise exception 'GARDE 1a: doublon % référencé par % module(s) — rollback', r.filiere_name, v; end if;
    end if; -- absent => déjà supprimé (idempotent), OK
  end loop;

  -- 1b. Chaque filière cible résout vers EXACTEMENT une filière (unicité de correspondance).
  for r in select distinct filiere_name from _backfill_map loop
    select count(*) into v from filieres where name = r.filiere_name;
    if v <> 1 then raise exception 'GARDE 1b: filière cible "%" -> % correspondance(s) (attendu 1) — rollback', r.filiere_name, v; end if;
  end loop;

  -- 1c. Chaque classe cible existe, nom inchangé, et est NULL ou déjà rattachée à la BONNE filière.
  for r in select m.class_id, m.class_name, m.filiere_name, c.filiere_id as cur, f.id as fid
           from _backfill_map m
           left join classes c on c.id = m.class_id
           left join filieres f on f.name = m.filiere_name loop
    if not exists (select 1 from classes where id = r.class_id) then
      raise exception 'GARDE 1c: classe cible introuvable: % (%)', r.class_name, r.class_id;
    end if;
    if not exists (select 1 from classes where id = r.class_id and name = r.class_name) then
      raise exception 'GARDE 1c: nom de classe modifié depuis le dry-run: % (%)', r.class_name, r.class_id;
    end if;
    if r.cur is not null and r.cur is distinct from r.fid then
      raise exception 'GARDE 1c: classe % déjà rattachée à une AUTRE filière (%) — rollback', r.class_name, r.cur;
    end if;
  end loop;

  -- 1d. Anti-conflit : après backfill, (filiere_id, level, academic_year) doit rester unique.
  for r in
    with post as (
      select c.id, coalesce(f.id, c.filiere_id) as fid, c.level, c.academic_year
      from classes c
      left join _backfill_map m on m.class_id = c.id
      left join filieres f on f.name = m.filiere_name
      where c.kind = 'diplome' and c.academic_year = '2025-2026'
    )
    select fid, level, academic_year, count(*) n from post where fid is not null group by 1,2,3 having count(*) > 1
  loop
    raise exception 'GARDE 1d: conflit unicité prévu (filiere %, %, %) -> % classes — rollback', r.fid, r.level, r.academic_year, r.n;
  end loop;
end $$;

-- ---------------- MUTATIONS ----------------
-- 2. Backfill (idempotent : n'écrit que si filiere_id IS NULL)
update classes c
set filiere_id = f.id
from _backfill_map m join filieres f on f.name = m.filiere_name
where c.id = m.class_id and c.filiere_id is null;

-- 3. Suppression des doublons (déjà prouvés à 0 référence par la garde 1a)
delete from filieres f using _dup_filieres d where f.id = d.filiere_id;

-- ---------------- GARDES APRÈS ----------------
do $$
declare v int;
begin
  -- 4a. Les 21 classes cibles sont toutes rattachées à la bonne filière.
  select count(*) into v
  from _backfill_map m join filieres f on f.name = m.filiere_name join classes c on c.id = m.class_id
  where c.filiere_id is distinct from f.id;
  if v <> 0 then raise exception 'GARDE 4a: % classe(s) cible mal rattachée — rollback', v; end if;

  -- 4b. Aucun doublon ne subsiste.
  select count(*) into v from filieres f join _dup_filieres d on d.filiere_id = f.id;
  if v <> 0 then raise exception 'GARDE 4b: % doublon(s) subsistant — rollback', v; end if;

  -- 4c. Contrôle final d'unicité sur l'année active (doit être 0).
  select count(*) into v from (
    select 1 from classes where kind='diplome' and academic_year='2025-2026' and filiere_id is not null
    group by filiere_id, level, academic_year having count(*) > 1
  ) t;
  if v <> 0 then raise exception 'GARDE 4c: % combinaison(s) (filiere,level,annee) en doublon — rollback', v; end if;

  raise notice 'OK — backfill 21 classes + suppression 4 doublons appliqués (idempotent).';
end $$;

commit;
