-- D1 — Rôle institutionnel « Directeur des Études ».
-- Additif et sûr : ajoute une valeur à l'enum user_role. Aucune RLS/garde
-- modifiée ici (c'est D2). `pedagogie` reste un service distinct.
-- Idempotent : IF NOT EXISTS. (ALTER TYPE ... ADD VALUE ne peut pas tourner
-- dans une transaction multi-instructions → à exécuter seul.)
alter type public.user_role add value if not exists 'directeur_etudes';
