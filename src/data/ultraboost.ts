/**
 * Catalogue UltraBoost — Executive Bootcamps, organisés par SECTEUR.
 * Le contenu du modal « Programme » est un gabarit commun (le titre change).
 *
 * 👉 Pour gérer : modifier ULTRABOOST_SECTORS (secteurs + bootcamps).
 */

export type UltraBoostBootcamp = { id: string; title: string };

export type UltraBoostSector = {
  id: string;
  icon: string;
  title: string;
  bootcamps: UltraBoostBootcamp[];
};

/** Durée et tarif indicatifs communs (affichés sur les cartes / le modal). */
export const ULTRABOOST_DURATION_H = 42;
export const ULTRABOOST_PRICE = "730 000 FCFA";

export const ULTRABOOST_SECTORS: UltraBoostSector[] = [
  {
    id: "direction",
    icon: "💼",
    title: "Direction, management & stratégie",
    bootcamps: [
      { id: "ub-manager-ia", title: "Manager augmenté par l'IA" },
      { id: "ub-ia-dirigeants", title: "IA pour dirigeants & prise de décision" },
      { id: "ub-assistant-direction", title: "Assistant de direction augmenté par l'IA" },
      { id: "ub-transfo-pme", title: "Transformation digitale des PME" },
    ],
  },
  {
    id: "projets",
    icon: "🚀",
    title: "Projets, transformation & entrepreneuriat",
    bootcamps: [
      { id: "ub-chef-projet", title: "Chef de projet digital & transformation numérique" },
      { id: "ub-pilotage-projet-ia", title: "Pilotage de projet IA en entreprise" },
      { id: "ub-entrepreneuriat", title: "Entrepreneuriat digital & IA" },
    ],
  },
  {
    id: "finance",
    icon: "📊",
    title: "Finance, comptabilité & data",
    bootcamps: [
      { id: "ub-comptabilite-ia", title: "Comptabilité augmentée par l'IA" },
      { id: "ub-finance-ia", title: "Finance, analyse & reporting avec IA" },
      { id: "ub-controle-gestion-ia", title: "Contrôle de gestion avec IA" },
      { id: "ub-data-excel-bi", title: "Data, Excel, Power BI & reporting" },
    ],
  },
  {
    id: "rh",
    icon: "🤝",
    title: "RH, formation & administration",
    bootcamps: [
      { id: "ub-rh-talents", title: "RH, recrutement & talents avec IA" },
      { id: "ub-formateur", title: "Formateur digital & IA" },
      { id: "ub-administration", title: "Administration, bureautique & productivité IA" },
    ],
  },
  {
    id: "marketing",
    icon: "📣",
    title: "Marketing, vente, communication & client",
    bootcamps: [
      { id: "ub-marketing-crm", title: "Marketing, vente & CRM avec IA" },
      { id: "ub-marketing-digital-ia", title: "Marketing digital avec IA" },
      { id: "ub-communication", title: "Communication digitale & stratégie IA" },
      { id: "ub-ecommerce", title: "E-commerce & stratégie IA" },
      { id: "ub-support-client", title: "Support client, CRM & chatbot IA" },
    ],
  },
  {
    id: "tech",
    icon: "🛡️",
    title: "Tech, IA, automatisation, sécurité & conformité",
    bootcamps: [
      { id: "ub-automatisation-nocode", title: "Automatisation, no-code & productivité IA" },
      { id: "ub-dev-apps-ia", title: "Développement d'applications avec IA" },
      { id: "ub-cyber-donnees", title: "Cybersécurité & protection des données" },
      { id: "ub-droit", title: "Droit du digital & IA" },
      { id: "ub-gouvernance-donnees", title: "Gouvernance des données & conformité numérique" },
    ],
  },
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
  { label: "Accompagnement individuel", desc: "Suivi personnalisé et sur-mesure" },
  { label: "Entreprise", desc: "Cohorte dédiée pour vos équipes" },
  { label: "Association", desc: "Format adapté aux groupes et organisations" },
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
