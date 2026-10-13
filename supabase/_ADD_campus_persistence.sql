-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot B : persistance Campus (parcours académique + cardinalité docs).
-- REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT.
-- Additif, idempotent (re-run = 0 changement), non destructif.
--
--   1) inscription_requests.graduation_year int NULL   (année d'obtention)
--   2) inscription_requests.institution     text NULL  (établissement d'origine)
--   3) document_types.max_files int NOT NULL DEFAULT 1 (cardinalité)
--   4) bulletins.max_files = 10                         (plusieurs relevés)
--
-- La RPC submit_candidature v3 (fichier _ADD_submit_candidature.sql) consomme
-- ces colonnes. Appliquer CE fichier AVANT la RPC v3.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) + 2) Parcours académique persisté au dépôt (nullable, jamais rétroactif)
alter table public.inscription_requests
  add column if not exists graduation_year int,
  add column if not exists institution     text;

comment on column public.inscription_requests.graduation_year is
  'Année d''obtention du dernier diplôme (Étape 2). NULL si non renseignée.';
comment on column public.inscription_requests.institution is
  'Établissement d''origine (Étape 2). NULL si non renseigné.';

-- 3) Cardinalité data-driven des pièces (défaut : pièce unique)
alter table public.document_types
  add column if not exists max_files int not null default 1;

comment on column public.document_types.max_files is
  'Nombre max de fichiers pour ce type (1 = pièce unique → « Remplacer »).';

-- Garde-fou : max_files toujours ≥ 1
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'document_types_max_files_chk') then
    alter table public.document_types
      add constraint document_types_max_files_chk check (max_files >= 1);
  end if;
end $$;

-- 4) Bulletins / relevés : plusieurs fichiers (les autres restent à 1 par défaut)
update public.document_types set max_files = 10 where doc_key = 'bulletins';

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$
declare v int;
begin
  select max_files into v from public.document_types where doc_key = 'bulletins';
  if v is distinct from 10 then raise exception 'CONTRÔLE : bulletins.max_files=% (attendu 10)', v; end if;
  select count(*) into v from public.document_types where max_files < 1;
  if v <> 0 then raise exception 'CONTRÔLE : % type(s) avec max_files < 1', v; end if;
  raise notice 'OK — colonnes graduation_year/institution + max_files (bulletins=10) en place.';
end $$;

commit;

-- ROLLBACK (bloc de secours, non exécuté) :
-- alter table public.document_types drop constraint if exists document_types_max_files_chk;
-- alter table public.document_types      drop column if exists max_files;
-- alter table public.inscription_requests drop column if exists institution;
-- alter table public.inscription_requests drop column if exists graduation_year;
