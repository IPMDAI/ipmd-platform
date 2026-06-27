/**
 * Catalogue riche UltraBoost — VIP Bootcamps.
 * Niveaux : SPECIALIST → MANAGER → DIRECTOR → EXECUTIVE.
 * Le contenu du modal « Programme » est un gabarit commun (le titre change).
 *
 * 👉 Pour compléter : ajouter les bootcamps des niveaux MANAGER/DIRECTOR/EXECUTIVE
 *    dans BOOTCAMPS_BY_LEVEL (mêmes objets { id, title }).
 */

export type UltraBoostLevelKey = "specialist" | "manager" | "director" | "executive";

export type UltraBoostLevel = {
  key: UltraBoostLevelKey;
  label: string;
  tagline: string;
  durationH: number;
  price: string;
  certPrice: string;
};

export const ULTRABOOST_LEVELS: UltraBoostLevel[] = [
  { key: "specialist", label: "SPECIALIST", tagline: "Expertise Métier", durationH: 42, price: "730 000 FCFA", certPrice: "545 000 FCFA" },
  { key: "manager", label: "MANAGER", tagline: "Pilotage & Management", durationH: 42, price: "à définir", certPrice: "à définir" },
  { key: "director", label: "DIRECTOR", tagline: "Direction & Stratégie", durationH: 42, price: "à définir", certPrice: "à définir" },
  { key: "executive", label: "EXECUTIVE", tagline: "Gouvernance & Vision", durationH: 42, price: "à définir", certPrice: "à définir" },
];

export type UltraBoostBootcamp = { id: string; title: string };

export const BOOTCAMPS_BY_LEVEL: Record<UltraBoostLevelKey, UltraBoostBootcamp[]> = {
  specialist: [
    { id: "spec-marketing-ia", title: "Marketing Digital & Stratégie IA" },
    { id: "spec-marketing-des-ia", title: "Marketing des IA" },
    { id: "spec-ecommerce-ia", title: "E-Commerce & Stratégie IA" },
    { id: "spec-communication-ia", title: "Communication Digitale & Stratégie IA" },
    { id: "spec-design", title: "Design & Graphisme Digital" },
    { id: "spec-uxui", title: "UX/UI & Produits Numériques" },
    { id: "spec-web", title: "Développement de Sites Web" },
    { id: "spec-mobile", title: "Développement d'Applications Mobiles" },
    { id: "spec-cloud", title: "Cloud & DevOps" },
    { id: "spec-droit", title: "Droit du Digital & IA" },
    { id: "spec-data", title: "Data & Analyse" },
    { id: "spec-fintech", title: "FinTech" },
    { id: "spec-cyber", title: "Cybersécurité" },
    { id: "spec-ia", title: "Intelligence Artificielle" },
  ],
  manager: [],
  director: [],
  executive: [],
};

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

export const getLevel = (key: string) => ULTRABOOST_LEVELS.find((l) => l.key === key);
