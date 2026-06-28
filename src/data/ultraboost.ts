/**
 * Catalogue UltraBoost — VIP Bootcamps (liste unique, sans niveaux).
 * Le contenu du modal « Programme » est un gabarit commun (le titre change).
 *
 * 👉 Pour gérer : modifier ULTRABOOST_BOOTCAMPS (id + titre).
 */

export type UltraBoostBootcamp = { id: string; title: string };

/** Durée et tarif indicatifs communs (affichés sur les cartes / le modal). */
export const ULTRABOOST_DURATION_H = 42;
export const ULTRABOOST_PRICE = "730 000 FCFA";

export const ULTRABOOST_BOOTCAMPS: UltraBoostBootcamp[] = [
  { id: "ub-manager-ia", title: "Manager augmenté par l'IA" },
  { id: "ub-assistant-direction", title: "Assistant de direction & productivité IA" },
  { id: "ub-compta-finance", title: "Comptabilité, finance & contrôle avec IA" },
  { id: "ub-data-excel-bi", title: "Data, Excel, Power BI & reporting" },
  { id: "ub-rh-talents", title: "RH, recrutement & gestion des talents avec IA" },
  { id: "ub-marketing-crm", title: "Marketing, vente, CRM & relation client avec IA" },
  { id: "ub-chef-projet", title: "Chef de projet digital & transformation numérique" },
  { id: "ub-automatisation-nocode", title: "Automatisation, no-code & productivité IA" },
  { id: "ub-cyber-donnees", title: "Cybersécurité & protection des données professionnelles" },
  { id: "ub-formateur", title: "Formateur digital / formateur IA" },
  { id: "ub-communication", title: "Communication Digitale & Stratégie IA" },
  { id: "ub-ecommerce", title: "E-Commerce & Stratégie IA" },
  { id: "ub-droit", title: "Droit du Digital & IA" },
  { id: "ub-marketing-des-ia", title: "Marketing des IA" },
  { id: "ub-dev-apps-ia", title: "Développement d'Applications avec IA" },
];

/** Gabarit commun du programme (modal). */
export const ULTRABOOST_SCHEDULES = [
  { icon: "🌅", label: "Morning", time: "09h - 12h", desc: "Parfait pour bien démarrer la journée" },
  { icon: "☀️", label: "Afternoon", time: "13h - 15h", desc: "Idéal après le déjeuner" },
  { icon: "🌞", label: "Full Day", time: "09h - 15h", desc: "Immersion complète" },
  { icon: "🌙", label: "Evening", time: "18h - 21h", desc: "Pour les professionnels actifs" },
];

export const ULTRABOOST_FORMATS = [
  { label: "En ligne", desc: "Cours en direct avec interaction en temps réel" },
  { label: "Premium", desc: "Présentiel + à distance ou hybride" },
  { label: "VIP", desc: "Accompagnement personnalisé et sur-mesure" },
  { label: "Famille", desc: "Accompagnement personnalisé et sur-mesure" },
  { label: "Entreprise", desc: "Accompagnement personnalisé et sur-mesure" },
  { label: "Association", desc: "Accompagnement personnalisé et sur-mesure" },
  { label: "Autres groupes", desc: "Accompagnement personnalisé et sur-mesure" },
];

export const ULTRABOOST_INCLUDED = [
  "Accès à la plateforme de bootcamp",
  "Support pédagogique complet",
  "Certificat de réussite officiel",
  "Accès communauté UltraBoost",
];

export const ULTRABOOST_PREREQUIS = [
  "Motivation et engagement",
  "Ordinateur",
  "Disponibilité selon horaires choisis",
  "Niveau adapté au bootcamp",
];

export const ULTRABOOST_OBJECTIFS_SPECIFIQUES = [
  "Appliquer les méthodes et outils du programme dans votre contexte professionnel",
  "Valider les acquis par des livrables et mises en situation encadrées",
  "Préparer la certification et votre visibilité au sein du réseau UltraBoost",
];
