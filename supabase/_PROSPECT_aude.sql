-- ──────────────────────────────────────────────────────────────
-- IPMD — Prospect de test : Aude-Lucrèce Kouamé (demande reçue par email).
-- À coller dans Supabase > SQL Editor. (email à compléter ensuite dans le module)
-- ──────────────────────────────────────────────────────────────

insert into public.prospects
  (full_name, email, program_interest, level_interest, format, source, status, message)
values (
  'Aude-Lucrèce Kouamé',
  null,                                   -- ⚠️ ajoute son email dans Marketing pour pouvoir lui répondre
  'Master Communication Digitale (ou Management Digital)',
  'Master 1',
  'soir',
  'email',
  'nouveau',
  'Titulaire d''une Licence en Journalisme, souhaite se réorienter vers le numérique. Demande pour la rentrée 2026, en cours du soir. Questions : plaquette + volume horaire des cours du soir et modalités de réorientation ; frais d''inscription et de scolarité Master 1 et Master 2 ; modalités de sélection (dossier/test/entretien) ; date limite de dépôt des dossiers.'
);
