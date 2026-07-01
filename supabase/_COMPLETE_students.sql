-- ══════════════════════════════════════════════════════════════
-- IPMD — Compléter les étudiants déjà créés :
--   date/lieu de naissance + affectation classe (→ filière).
-- Modèles à adapter. À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- 1) DATE + LIEU DE NAISSANCE (par email — le plus fiable)
update public.profiles
set birth_date  = '1994-03-06',            -- AAAA-MM-JJ
    birth_place = 'Daloa (Côte d''Ivoire)' -- noter le '' pour l'apostrophe
where email = 'etudiant@example.com';

-- (Variante par nom)
-- update public.profiles
-- set birth_date = '2000-05-12', birth_place = 'Abidjan (Côte d''Ivoire)'
-- where full_name ilike '%Tonian%Eliam%';


-- 2) AFFECTER un étudiant à une CLASSE (définit sa filière)
--    Remplace l'email et le nom EXACT de la classe.
insert into public.class_members (student_id, class_id)
select p.id, c.id
from public.profiles p, public.classes c
where p.email = 'etudiant@example.com'
  and c.name  = 'Licence 1 Informatique'      -- nom exact de la classe
on conflict (student_id) do update set class_id = excluded.class_id;


-- 3) METTRE une FILIÈRE sur une classe (si la classe n'en a pas)
--    (la filière doit exister dans public.filieres)
-- update public.classes
-- set filiere_id = (select id from public.filieres where name ilike '%Marketing Digital%' limit 1)
-- where name = 'Licence 1 Informatique';


-- 4) CONTRÔLE — voir ce qui manque encore
-- select p.full_name, p.email, p.birth_date, p.birth_place,
--        c.name as classe, f.name as filiere
-- from public.profiles p
-- left join public.class_members m on m.student_id = p.id
-- left join public.classes c on c.id = m.class_id
-- left join public.filieres f on f.id = c.filiere_id
-- where p.role = 'etudiant'
-- order by p.full_name;
