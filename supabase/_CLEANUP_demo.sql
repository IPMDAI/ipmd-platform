-- ══════════════════════════════════════════════════════════════
-- IPMD — Suppression des données de DÉMO.
-- Retire les 10 étudiants de démo (@demo.ipmd.test) et leurs 3 cohortes.
-- La suppression des comptes auth supprime en cascade : profils,
-- dossiers financiers, paiements, échéances, affectations de classe.
-- À exécuter dans Supabase > SQL Editor. Sans effet sur les vrais étudiants.
-- ══════════════════════════════════════════════════════════════

-- Étudiants de démo (cascade → profiles, student_finance, payments, …)
delete from auth.users where email like '%@demo.ipmd.test';

-- Cohortes de démo (cascade → class_members)
delete from public.classes where id in (
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003'
);
-- Filet de sécurité si les UUID ont changé : suppression par nom.
delete from public.classes
where name in (
  'Licence 1 — Initial Campus',
  'Licence 1 Pro — Salariés',
  'Licence 2 — Partenaire Académie X'
);
