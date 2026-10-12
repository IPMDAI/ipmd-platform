-- ─────────────────────────────────────────────────────────────────────────
-- Nettoyage des 4 filières fantômes « & » (doublons en_attente, 0 classe/
-- étudiant/candidature/offre). Suppression modules → filières, SANS CASCADE.
-- Garde-fous : arrêt immédiat si le nombre attendu diffère (192 modules, 4 fil).
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  ids uuid[] := array[
    '47bc006c-5922-4e2b-ac45-f95537b2b07b',  -- Comptabilité & finance digitale
    '1da78158-4fcc-4178-ba0f-a76e64d2d237',  -- E-commerce & commerce international
    '5ad60a09-8398-4fea-88f0-3907ef9ba53f',  -- Graphisme & Design
    '10dac426-f527-496e-b72c-3f40d0c8733d'   -- Informatique & intelligence artificielle
  ];
  n int;
begin
  -- Contrôle AVANT : exactement 192 modules sur ces 4 ids.
  select count(*) into n from public.modules where filiere_id = any(ids);
  if n <> 192 then raise exception 'ARRET : % modules sur les 4 ids (attendu 192)', n; end if;

  -- Contrôle : ces 4 ids sont bien les fantômes « & »/en_attente.
  select count(*) into n from public.filieres where id = any(ids) and status='en_attente' and name like '%&%';
  if n <> 4 then raise exception 'ARRET : % filieres fantomes confirmees (attendu 4)', n; end if;

  -- Suppression modules puis filières (sans CASCADE).
  delete from public.modules where filiere_id = any(ids);
  get diagnostics n = row_count;
  if n <> 192 then raise exception 'ARRET : % modules supprimes (attendu 192)', n; end if;

  delete from public.filieres where id = any(ids);
  get diagnostics n = row_count;
  if n <> 4 then raise exception 'ARRET : % filieres supprimees (attendu 4)', n; end if;

  raise notice 'Nettoyage OK : 192 modules + 4 filieres fantomes supprimes.';
end $$;
