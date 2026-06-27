-- ══════════════════════════════════════════════════════════════
-- IPMD — Sessions bootcamp : frais propres par session.
-- Une classe peut être de type 'diplome' (par défaut) ou 'bootcamp'.
-- Pour les bootcamps : frais d'inscription propres (0 = aucun),
-- nombre de versements (1 à 5), et mode (présentiel/distance/hybride).
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- ══════════════════════════════════════════════════════════════

alter table public.classes add column if not exists kind text not null default 'diplome'; -- diplome | bootcamp
alter table public.classes add column if not exists registration_fee numeric(12, 2);       -- frais d'inscription propres (null = tarif global, 0 = aucun)
alter table public.classes add column if not exists installments int not null default 1;    -- nombre de versements autorisés (1 à 5)
alter table public.classes add column if not exists mode text;                              -- presentiel | distance | hybride

-- Mémoriser le nb de versements et le mode au niveau de l'étudiant (suivi).
alter table public.student_finance add column if not exists installments int;
alter table public.student_finance add column if not exists mode text;
