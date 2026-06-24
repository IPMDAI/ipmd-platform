-- ══════════════════════════════════════════════════════════════
-- IPMD — DONNÉES DE DÉMO Finance (10 étudiants, 3 cohortes).
-- But : visualiser la page Finance (cohortes, régimes, statuts,
-- réductions, reste, avance/trop-perçu, échéanciers).
-- 100% SUPPRIMABLE — voir le bloc « NETTOYAGE » plus bas.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- ── NETTOYAGE (ré-exécutable) : retire toute donnée de démo ─────
delete from auth.users where email like '%@demo.ipmd.test';
delete from public.classes where id in (
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003'
);

-- ── 1. Comptes auth (mot de passe bidon, non utilisés) ─────────
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','demo01@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2025-10-02', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000002','authenticated','authenticated','demo02@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2025-10-05', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000003','authenticated','authenticated','demo03@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2025-10-10', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000004','authenticated','authenticated','demo04@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2025-10-12', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000005','authenticated','authenticated','demo05@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-02-10', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000006','authenticated','authenticated','demo06@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-02-12', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000007','authenticated','authenticated','demo07@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-02-15', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000008','authenticated','authenticated','demo08@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-03-10', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000009','authenticated','authenticated','demo09@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-03-11', now(), '','','',''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000010','authenticated','authenticated','demo10@demo.ipmd.test', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', '2026-03-12', now(), '','','','');

-- ── 2. Profils étudiants ───────────────────────────────────────
insert into public.profiles (id, email, full_name, role, created_at) values
  ('d0000000-0000-4000-8000-000000000001','demo01@demo.ipmd.test','Koffi Adjoua','etudiant','2025-10-02'),
  ('d0000000-0000-4000-8000-000000000002','demo02@demo.ipmd.test','Yao Ettien','etudiant','2025-10-05'),
  ('d0000000-0000-4000-8000-000000000003','demo03@demo.ipmd.test','Aya Brou','etudiant','2025-10-10'),
  ('d0000000-0000-4000-8000-000000000004','demo04@demo.ipmd.test','Konan Marie','etudiant','2025-10-12'),
  ('d0000000-0000-4000-8000-000000000005','demo05@demo.ipmd.test','Diaby Sékou','etudiant','2026-02-10'),
  ('d0000000-0000-4000-8000-000000000006','demo06@demo.ipmd.test','Traoré Awa','etudiant','2026-02-12'),
  ('d0000000-0000-4000-8000-000000000007','demo07@demo.ipmd.test','N''Guessan Paul','etudiant','2026-02-15'),
  ('d0000000-0000-4000-8000-000000000008','demo08@demo.ipmd.test','Bamba Fatou','etudiant','2026-03-10'),
  ('d0000000-0000-4000-8000-000000000009','demo09@demo.ipmd.test','Coulibaly Ali','etudiant','2026-03-11'),
  ('d0000000-0000-4000-8000-000000000010','demo10@demo.ipmd.test','Kouassi Lyne','etudiant','2026-03-12')
on conflict (id) do update set full_name = excluded.full_name, role = 'etudiant';

-- ── 3. Cohortes de démo ────────────────────────────────────────
insert into public.classes (id, name, level, academic_year, intake, class_type, partner_name, start_date, end_date, payment_regime, tuition_amount) values
  ('c0000000-0000-4000-8000-000000000001','Licence 1 — Initial Campus','Licence 1','2025-2026','Octobre 2025','initial',null,'2025-10-01','2026-07-30','classique',null),
  ('c0000000-0000-4000-8000-000000000002','Licence 1 Pro — Salariés','Licence 1','2025-2026','Février 2026','pro',null,'2026-02-10','2026-12-15','professionnel',1500000),
  ('c0000000-0000-4000-8000-000000000003','Licence 2 — Partenaire Académie X','Licence 2','2025-2026','Mars 2026','partenaire','Académie X','2026-03-10','2026-11-30','partenaire',1200000);

-- ── 4. Dossiers financiers (réduction sur scolarité uniquement) ─
-- total_due = inscription 300000 + scolarité après réduction.
insert into public.student_finance
  (student_id, registration_fee, tuition_due, discount_rate, level, academic_year, access_state, negotiated, total_due, payer_note) values
  ('d0000000-0000-4000-8000-000000000001',300000,1850000,0,    'Licence 1','2025-2026','actif',false,2150000,'Bon payeur'),
  ('d0000000-0000-4000-8000-000000000002',300000,1850000,0.15, 'Licence 1','2025-2026','actif',false,1872500,'Paiement régulier'),
  ('d0000000-0000-4000-8000-000000000003',300000,1850000,0,    'Licence 1','2025-2026','pause',false,2150000,'À relancer'),
  ('d0000000-0000-4000-8000-000000000004',300000,1850000,0,    'Licence 1','2025-2026','pause',false,2150000,'Paiement en attente de preuve'),
  ('d0000000-0000-4000-8000-000000000005',300000,1500000,0,    'Licence 1','2025-2026','actif',false,1800000,'Avance à vérifier'),
  ('d0000000-0000-4000-8000-000000000006',300000,1500000,0,    'Licence 1','2025-2026','actif',true, 1800000,'Échéancier négocié'),
  ('d0000000-0000-4000-8000-000000000007',300000,1500000,0.15, 'Licence 1','2025-2026','actif',true, 1575000,'Paiement irrégulier'),
  ('d0000000-0000-4000-8000-000000000008',300000,1200000,0,    'Licence 2','2025-2026','actif',false,1500000,'Bon payeur'),
  ('d0000000-0000-4000-8000-000000000009',300000,1200000,0,    'Licence 2','2025-2026','pause',true, 1500000,'Cas sensible'),
  ('d0000000-0000-4000-8000-000000000010',300000,1200000,0,    'Licence 2','2025-2026','pause',false,1500000,'À relancer')
on conflict (student_id) do update set
  registration_fee = excluded.registration_fee, tuition_due = excluded.tuition_due,
  discount_rate = excluded.discount_rate, level = excluded.level,
  academic_year = excluded.academic_year, access_state = excluded.access_state,
  negotiated = excluded.negotiated, total_due = excluded.total_due, payer_note = excluded.payer_note;

-- ── 5. Affectation aux cohortes ────────────────────────────────
insert into public.class_members (class_id, student_id) values
  ('c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000005'),
  ('c0000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000007'),
  ('c0000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-000000000008'),
  ('c0000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-000000000009'),
  ('c0000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-000000000010')
on conflict (student_id) do update set class_id = excluded.class_id;

-- ── 6. Paiements (kind: inscription / scolarite) ───────────────
insert into public.payments (student_id, amount, method, kind, paid_at) values
  -- s01 soldé
  ('d0000000-0000-4000-8000-000000000001',300000,'Wave','inscription','2025-10-02'),
  ('d0000000-0000-4000-8000-000000000001',1850000,'Versement BACI','scolarite','2025-11-15'),
  -- s02 soldé avec réduction 15%
  ('d0000000-0000-4000-8000-000000000002',300000,'Wave','inscription','2025-10-05'),
  ('d0000000-0000-4000-8000-000000000002',1572500,'Versement AFG','scolarite','2025-12-01'),
  -- s03 inscription seule (scolarité non soldée)
  ('d0000000-0000-4000-8000-000000000003',300000,'Espèces','inscription','2025-10-10'),
  -- s04 rien payé (inscription non soldée)
  -- s05 trop-perçu (avance)
  ('d0000000-0000-4000-8000-000000000005',300000,'Wave','inscription','2026-02-10'),
  ('d0000000-0000-4000-8000-000000000005',1700001,'Virement bancaire','scolarite','2026-03-20'),
  -- s06 partiel + en retard (échéancier)
  ('d0000000-0000-4000-8000-000000000006',300000,'Wave','inscription','2026-02-12'),
  ('d0000000-0000-4000-8000-000000000006',500000,'Espèces','scolarite','2026-03-01'),
  -- s07 partiel + échéancier à venir
  ('d0000000-0000-4000-8000-000000000007',300000,'Wave','inscription','2026-02-15'),
  ('d0000000-0000-4000-8000-000000000007',600000,'Versement BACI','scolarite','2026-04-10'),
  -- s08 soldé (partenaire)
  ('d0000000-0000-4000-8000-000000000008',300000,'Wave','inscription','2026-03-10'),
  ('d0000000-0000-4000-8000-000000000008',1200000,'Virement bancaire','scolarite','2026-04-15'),
  -- s09 inscription seule
  ('d0000000-0000-4000-8000-000000000009',300000,'Espèces','inscription','2026-03-11');
  -- s10 rien payé

-- ── 7. Échéanciers ─────────────────────────────────────────────
insert into public.payment_schedules (student_id, label, amount, due_date) values
  -- s06 : 2 échéances passées non couvertes -> EN RETARD
  ('d0000000-0000-4000-8000-000000000006','1re tranche',900000,'2026-02-15'),
  ('d0000000-0000-4000-8000-000000000006','2e tranche',900000,'2026-05-15'),
  -- s07 : échéances à venir
  ('d0000000-0000-4000-8000-000000000007','1re tranche',787500,'2026-08-01'),
  ('d0000000-0000-4000-8000-000000000007','2e tranche',787500,'2026-11-01'),
  -- s10 : échéances à venir
  ('d0000000-0000-4000-8000-000000000010','1re tranche',750000,'2026-09-01'),
  ('d0000000-0000-4000-8000-000000000010','2e tranche',750000,'2026-12-01');

-- ══════════════════════════════════════════════════════════════
-- Pour TOUT supprimer plus tard, exécuter uniquement :
--   delete from auth.users where email like '%@demo.ipmd.test';
--   delete from public.classes where name like '%Initial Campus%'
--      or name like '%Pro — Salariés%' or name like '%Partenaire Académie X%';
-- ══════════════════════════════════════════════════════════════
