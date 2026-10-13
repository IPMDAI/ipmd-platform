-- ══════════════════════════════════════════════════════════════
-- IPMD — Certificats SeniorsHub (données). REVUE — NE PAS APPLIQUER SANS FEU VERT.
-- Requiert Lot DB #1 certificats (colonnes + needs_intake + sessions) déjà appliqué,
-- et les 2 sessions certificat déjà OUVERTES (Octobre 2026 / Février 2027).
-- SeniorsHub part de ZÉRO (0 item aujourd'hui) → INSERT (pas UPDATE).
-- Crée 6 items SeniorsHub (tier competence, cert-light, 3 mois, 385 000, reg 100 000),
-- les ouvre, crée 12 offerings (6 × 2 sessions ; level NULL ; prix 385 000).
-- RPC v6 inchangée (seniorshub → variant certificat, âge min 40, mode obligatoire).
-- N'affecte QUE SeniorsHub. Aucun autre univers touché.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Créer les 6 items SeniorsHub (sort_order 60-65 ; type=certificat ; status=open)
--    credential = 'Certificat de Compétence' (cohérent tier competence).
--    Descriptions orientées compétences/livrables (aucune promesse de résultat garanti).
insert into public.catalog_items
  (universe, type, name, description, credential, price, registration_fee,
   doc_profile, status, sort_order, cert_tier, category, duration_months)
values
  ('seniorshub','certificat',
   'IA & e-business : développer une activité en ligne',
   'Structurer une activité en ligne à l''aide des outils d''IA : positionnement d''une offre, création de contenus, choix des canaux de vente et suivi. Livrable : une offre en ligne cadrée et un plan de mise en œuvre.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 60, 'competence', 'IA & e-business', 3),

  ('seniorshub','certificat',
   'Digitaliser, transmettre & valoriser son expertise',
   'Transformer un savoir-faire métier en offre digitale (conseil, mentorat, ateliers) : structurer sa connaissance, choisir un format de transmission, préparer ses supports. Livrable : une offre de transmission documentée.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 61, 'competence', 'Valorisation & transmission d''expertise', 3),

  ('seniorshub','certificat',
   'Comprendre & utiliser l''IA au quotidien',
   'Prendre en main les principaux outils d''IA générative pour la rédaction, la recherche et l''organisation, sans prérequis technique. Livrable : une boîte à outils IA personnelle et des cas d''usage maîtrisés.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 62, 'competence', 'Fondamentaux IA & numérique', 3),

  ('seniorshub','certificat',
   'Personal branding & réseaux sociaux pour experts',
   'Construire une présence professionnelle en ligne cohérente : profil, ligne éditoriale et rythme de publication. Livrable : un profil professionnel optimisé et un calendrier éditorial.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 63, 'competence', 'Valorisation & transmission d''expertise', 3),

  ('seniorshub','certificat',
   'Créer et commercialiser sa formation ou son contenu en ligne',
   'Concevoir un produit de contenu (formation, ebook, atelier) et mettre en place un tunnel de vente simple. Livrable : un produit prêt à publier et un parcours de vente défini.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 64, 'competence', 'IA & e-business', 3),

  ('seniorshub','certificat',
   'Outils numériques essentiels : visio, cloud & sécurité',
   'Maîtriser les outils numériques du quotidien professionnel : visioconférence, stockage cloud, collaboration et bonnes pratiques de cybersécurité. Livrable : une autonomie sur les outils essentiels.',
   'Certificat de Compétence', 385000, 100000, 'cert-light', 'open', 65, 'competence', 'Fondamentaux IA & numérique', 3);

-- 2) 12 offerings = 6 items × 2 sessions certificat déjà ouvertes (level NULL ; prix 385000)
insert into public.catalog_offerings(item_id, intake_id, status, level, price)
select ci.id, i.id, 'open', null, 385000
from public.catalog_items ci
cross join public.intakes i
where ci.universe = 'seniorshub'
  and i.label in ('Certificats - Octobre 2026','Certificats - Fevrier 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items
   where universe='seniorshub' and cert_tier='competence' and price=385000
     and registration_fee=100000 and duration_months=3 and doc_profile='cert-light'
     and category is not null and status='open';
  if v <> 6 then raise exception 'CTRL items SeniorsHub : %/6', v; end if;
  select count(*) into v from public.catalog_offerings co
    join public.catalog_items ci on ci.id=co.item_id where ci.universe='seniorshub';
  if v <> 12 then raise exception 'CTRL offres SeniorsHub : %/12', v; end if;
  raise notice 'OK — SeniorsHub : 6 items open (competence), 12 offerings.';
end $$;

commit;
