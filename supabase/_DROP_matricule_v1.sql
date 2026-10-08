-- ─────────────────────────────────────────────────────────────────────────
-- Nettoyage ancien système matricule v1 (format AA-AAIPMD-NP-NNNNN).
-- Remplacé par v2 (supabase/_ADD_matricule_v2.sql, format IPMD-{N}EA{...}R{MM}).
--
-- Sûreté vérifiée en prod avant exécution :
--   • la fonction v2 assign_matricule(uuid,text,text) reste en place (non touchée) ;
--   • aucune fonction externe ne référence matricule_counters ni la v1 4-args
--     (submit_candidature n'en dépend pas) ;
--   • aucun code runtime n'appelle la v1.
-- Récupérable au besoin : définitions v1 conservées dans supabase/_ADD_matricule.sql.
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 1) Ancienne fonction d'attribution (4 arguments : nom + prénoms).
drop function if exists public.assign_matricule(uuid, text, text, text);

-- 2) Compteur annuel v1 (remplacé par la séquence globale matricule_seq).
drop table if exists public.matricule_counters;

-- Contrôle : la v2 doit toujours exister, la v1 ne doit plus exister.
do $$
declare v2 int; v1 int; tbl int;
begin
  select count(*) into v2 from pg_proc where proname='assign_matricule'
    and pg_get_function_identity_arguments(oid) = 'p_student uuid, p_academic_year text, p_month text';
  select count(*) into v1 from pg_proc where proname='assign_matricule'
    and pg_get_function_identity_arguments(oid) like '%p_last_name%';
  select count(*) into tbl from information_schema.tables
    where table_schema='public' and table_name='matricule_counters';
  if v2 <> 1 then raise exception 'CTRL v2 absente (%)', v2; end if;
  if v1 <> 0 then raise exception 'CTRL v1 encore presente'; end if;
  if tbl <> 0 then raise exception 'CTRL matricule_counters encore presente'; end if;
  raise notice 'OK - v1 supprimee, v2 intacte.';
end $$;

commit;
