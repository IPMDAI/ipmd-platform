-- ══════════════════════════════════════════════════════════════
-- IPMD — Pré-remplissage des partenaires cités.
-- Idempotent : ré-exécutable sans doublon (insère si le nom n'existe pas).
-- Les logos s'ajoutent ensuite depuis /espace/partenaires (upload).
-- À exécuter APRÈS partners.sql.
-- ══════════════════════════════════════════════════════════════

insert into public.partners (name, category, sort_order)
select v.name, v.category, v.sort_order
from (values
  -- 🎓 Académiques
  ('MBS Montpellier Business School', 'academique', 10),
  ('Université Senghor d''Alexandrie', 'academique', 20),
  -- 🏢 Entreprises
  ('GO Africa Online', 'entreprise', 10),
  ('Librairie de France Groupe', 'entreprise', 20),
  ('Olive Imprimerie', 'entreprise', 30),
  ('ToGet', 'entreprise', 40),
  ('Décathlon', 'entreprise', 50),
  -- 🤝 Associations
  ('Cercle Français', 'association', 10)
) as v(name, category, sort_order)
where not exists (
  select 1 from public.partners p where p.name = v.name
);
