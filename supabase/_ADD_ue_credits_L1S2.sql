-- ─────────────────────────────────────────────────────────────────────────
-- LMD : Unités d'Enseignement + crédits + maquette L1-S2 2026-2027.
-- Additif. Travail perso NON stocké (calculé). Facteur h/crédit versionné.
-- Cohérence Module→UE garantie par FK composite. Stage L1-S2 supprimé (0 dép.).
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- Sécurité 1 : facteur h/crédit PAR ANNÉE (pas de 25 figé).
create table if not exists public.academic_year_config (
  academic_year text primary key,
  hours_per_credit numeric not null check (hours_per_credit between 15 and 40)
);
insert into public.academic_year_config values ('2026-2027', 25)
  on conflict (academic_year) do nothing;

-- Colonnes additives (nullable ; NOT NULL en finalisation quand tous les
-- semestres seront structurés).
alter table public.modules add column if not exists credits integer;
alter table public.modules add column if not exists ue_id uuid;

-- Table UE versionnée par année.
create table if not exists public.unites_enseignement (
  id uuid primary key default gen_random_uuid(),
  code text not null, name text not null,
  filiere_id uuid not null, level text not null, semester text not null, academic_year text not null,
  created_at timestamptz default now(),
  constraint ue_uk unique (filiere_id, level, semester, academic_year, code),
  constraint ue_fk_target unique (id, filiere_id, level, semester, academic_year),
  constraint ue_annee_fmt check (academic_year ~ '^[0-9]{4}-[0-9]{4}$')
);

-- Sécurité 2 : FK composite → un module ne peut pointer que vers une UE de
-- MÊME filière/niveau/semestre/année.
alter table public.modules drop constraint if exists modules_ue_coherence;
alter table public.modules
  add constraint modules_ue_coherence
  foreign key (ue_id, filiere_id, level, semester, academic_year)
  references public.unites_enseignement (id, filiere_id, level, semester, academic_year);

-- Garde-fou : travail perso jamais négatif, via le facteur ANNUEL (skip si credits null).
create or replace function public.modules_credit_guard() returns trigger
language plpgsql as $g$
declare f numeric; prog int;
begin
  if NEW.credits is null then return NEW; end if;
  select hours_per_credit into f from public.academic_year_config where academic_year = NEW.academic_year;
  if f is null then return NEW; end if;
  prog := coalesce(NEW.heures_cours,0)+coalesce(NEW.heures_td,0)+coalesce(NEW.heures_tp,0)+coalesce(NEW.heures_projet,0);
  if NEW.credits * f < prog then
    raise exception 'GARDE_FOU : % credits x % h = % h < % h programmees (module %)',
      NEW.credits, f, NEW.credits*f, prog, NEW.name;
  end if;
  return NEW;
end $g$;
drop trigger if exists trg_modules_credit_guard on public.modules;
create trigger trg_modules_credit_guard before insert or update on public.modules
  for each row execute function public.modules_credit_guard();

-- Stage L1-S2 : 0 dépendance vérifiée → suppression (scope strict).
delete from public.modules
 where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027' and name='Stage';

-- 32 UE (4 × 8 filières).
insert into public.unites_enseignement (code, name, filiere_id, level, semester, academic_year)
select u.code, u.name, fl.filiere_id, 'Licence 1','Semestre 2','2026-2027'
from (values
  ('UE-L1S2-1','Fondamentaux numériques & techniques'),
  ('UE-L1S2-2','Compétences digitales & data'),
  ('UE-L1S2-3','Spécialisation & stratégie'),
  ('UE-L1S2-4','Projets & pratique professionnelle')
) u(code,name)
cross join (select distinct filiere_id from public.modules
            where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027') fl;

-- 40 modules tronc commun (5 × 8).
insert into public.modules (filiere_id, name, level, semester, academic_year,
       heures_cours, heures_td, heures_tp, heures_projet, credits, status)
select fl.filiere_id, m.name, 'Licence 1','Semestre 2','2026-2027', m.c, m.td, m.tp, m.pr, m.cr, 'actif'
from (values
  ('IA appliquée aux métiers du digital',12,12,12,0,4),
  ('Initiation au développement web (HTML/CSS)',12,12,12,0,4),
  ('Compétences numériques & no-code',6,6,12,6,2),
  ('Data & visualisation — initiation',6,6,12,6,2),
  ('Anglais professionnel 2',8,8,8,0,2)
) m(name,c,td,tp,pr,cr)
cross join (select distinct filiere_id from public.modules
            where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027') fl;

-- 8 spécialisations (1 par filière ; Graphisme renommé « par ordinateur »).
insert into public.modules (filiere_id, name, level, semester, academic_year,
       heures_cours, heures_td, heures_tp, heures_projet, credits, status, syllabus)
select f.id, sp.name, 'Licence 1','Semestre 2','2026-2027',12,12,12,0,4,'actif', sp.syl
from (values
  ('Marketing digital','Marketing opérationnel & community management', null),
  ('Communication digitale','Création de contenu & storytelling digital', null),
  ('Graphisme et Design','Création graphique assistée par ordinateur','Outils : Adobe Photoshop, Illustrator (Suite Adobe) et équivalents libres.'),
  ('Développement d''applications','Programmation : logique & bases du code', null),
  ('E-commerce et commerce international','Fondamentaux de la vente en ligne', null),
  ('Informatique et intelligence artificielle','Algorithmique & initiation à la programmation', null),
  ('Management de projet digital','Méthodes agiles & pilotage de projet', null),
  ('Comptabilité et finance digitale','Comptabilité & gestion digitale — bases', null)
) sp(fil,name,syl)
join public.filieres f on f.name = sp.fil;

-- MAJ des 4 modules existants (+ rename Hackathon + syllabus).
update public.modules set heures_cours=6,heures_td=6,heures_tp=12,heures_projet=6,credits=3
  where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027'
    and name='Fondamentaux de la gestion de projets digitaux';
update public.modules set heures_cours=6,heures_td=6,heures_tp=12,heures_projet=6,credits=3
  where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027'
    and name in ('Stratégie digitale','Stratégie marketing digital');
update public.modules set heures_cours=0,heures_td=0,heures_tp=0,heures_projet=30,credits=3
  where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027'
    and name='Projet individuel';
update public.modules
  set heures_cours=0,heures_td=0,heures_tp=0,heures_projet=30,credits=3,
      name='Hackathon & Projet collectif d''innovation digitale',
      syllabus='Constitution d''équipes ; problématique réelle / cas pratique ; recherche & idéation ; prototypage d''une solution ; outils digitaux & IA quand pertinent ; présentation finale / démonstration ; pitch devant jury ; évaluation du travail collectif et du résultat produit.'
  where level='Licence 1' and semester='Semestre 2' and academic_year='2026-2027'
    and name='Projet collectif';

-- Rattachement module → UE (par code, même filière/niveau/sem/année).
update public.modules m set ue_id = ue.id
from public.unites_enseignement ue
where ue.filiere_id=m.filiere_id and ue.level=m.level and ue.semester=m.semester
  and ue.academic_year=m.academic_year
  and m.level='Licence 1' and m.semester='Semestre 2' and m.academic_year='2026-2027'
  and ue.code = case
    when m.name in ('IA appliquée aux métiers du digital','Initiation au développement web (HTML/CSS)') then 'UE-L1S2-1'
    when m.name in ('Compétences numériques & no-code','Data & visualisation — initiation','Anglais professionnel 2') then 'UE-L1S2-2'
    when m.name in ('Stratégie digitale','Stratégie marketing digital',
      'Marketing opérationnel & community management','Création de contenu & storytelling digital',
      'Création graphique assistée par ordinateur','Programmation : logique & bases du code',
      'Fondamentaux de la vente en ligne','Algorithmique & initiation à la programmation',
      'Méthodes agiles & pilotage de projet','Comptabilité & gestion digitale — bases') then 'UE-L1S2-3'
    when m.name in ('Fondamentaux de la gestion de projets digitaux',
      'Hackathon & Projet collectif d''innovation digitale','Projet individuel') then 'UE-L1S2-4'
  end;

commit;
