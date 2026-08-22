import type { UniverseId } from "@/types";

/**
 * Étape 2 — « Votre parcours actuel ».
 *
 * ⚠️ Décrit UNIQUEMENT ce que le candidat a DÉJÀ atteint (études / diplômes /
 * activité). Le niveau ou programme VISÉ à l'IPMD relève de l'Étape 3 (Projet).
 * On n'emploie jamais l'expression « niveau d'entrée » ici. Le CV n'est PAS
 * demandé ici : il viendra à l'Étape 4 (Pièces).
 *
 * Quatre variantes, dérivées du parcours choisi à l'Étape 0 :
 *  - campus     : académique seul (niveau + diplôme requis).
 *  - pro        : académique requis + situation professionnelle FACULTATIVE.
 *  - executive  : académique requis + fonction professionnelle OBLIGATOIRE.
 *  - certificat : version allégée, tout facultatif (UltraJobs/Boost/Executive/SeniorsHub).
 */
export type Background = {
  lastLevel: string; // Dernier niveau d'études atteint
  lastDiploma: string; // Dernier diplôme obtenu
  graduationYear: string; // Année d'obtention (facultatif)
  institution: string; // Établissement d'origine (facultatif)
  currentSituation: string; // Situation / fonction actuelle (executive/certificat)
  // ── Profil professionnel structuré (variante « pro ») ──
  professionalStatus: string; // salarie | entrepreneur | independant | demandeur_emploi | autre
  currentPosition: string; // Fonction / poste actuel
  organization: string; // Organisation / entreprise (facultatif)
  sector: string; // Secteur d'activité (facultatif)
  experienceYears: string; // Années d'expérience (facultatif, numérique)
};

export const EMPTY_BACKGROUND: Background = {
  lastLevel: "",
  lastDiploma: "",
  graduationYear: "",
  institution: "",
  currentSituation: "",
  professionalStatus: "",
  currentPosition: "",
  organization: "",
  sector: "",
  experienceYears: "",
};

export type BackgroundVariant = "campus" | "pro" | "executive" | "certificat";

/** Variante dérivée de l'univers choisi à l'Étape 0. */
export function variantForUniverse(id: UniverseId | null): BackgroundVariant {
  if (id === "campus") return "campus";
  if (id === "professionnel") return "pro";
  if (id === "gouvernance") return "executive";
  return "certificat"; // ultrajobs / ultraboost / ultraexecutive / seniorshub
}

/** Niveaux d'études DÉJÀ ATTEINTS (jamais « niveau d'entrée »). */
export const EDUCATION_LEVELS = [
  "Niveau Terminale (Bac non obtenu)",
  "Baccalauréat",
  "Bac+1",
  "Bac+2 (BTS, DUT, DEUG…)",
  "Bac+3 (Licence, Bachelor…)",
  "Bac+4 (Maîtrise, M1…)",
  "Bac+5 (Master, MBA, Ingénieur…)",
  "Bac+8 (Doctorat, DBA…)",
  "Autre",
];

/**
 * Diplômes DÉJÀ OBTENUS — liste structurée (contexte ivoirien + international),
 * proposée en select à l'Étape 2. « Autre diplôme » ouvre une saisie libre.
 * Volontairement compacte et maintenable (pas un référentiel exhaustif).
 */
export const ACADEMIC_DIPLOMAS = [
  "Aucun diplôme",
  "BEPC",
  "CAP",
  "BT (Brevet de Technicien)",
  "Baccalauréat général",
  "Baccalauréat technique",
  "BTS (Brevet de Technicien Supérieur)",
  "DUT",
  "DEUG",
  "Licence",
  "Licence professionnelle",
  "Bachelor",
  "Maîtrise",
  "Master 1",
  "Master 2 / Master",
  "MBA",
  "Diplôme d'ingénieur",
  "Doctorat / PhD",
  "DBA",
];

/** Valeur sentinelle du select diplôme déclenchant la saisie libre. */
export const OTHER_DIPLOMA = "__autre__";

/** Un diplôme saisi correspond-il à « Autre » (hors liste, non vide) ? */
export const isOtherDiploma = (diploma: string): boolean =>
  diploma.trim() !== "" && !ACADEMIC_DIPLOMAS.includes(diploma);

/**
 * Années d'obtention proposées (select dynamique) : de l'année courante jusqu'à
 * ~60 ans en arrière. Calculé au runtime — aucune liste figée.
 */
export function graduationYearOptions(span = 60): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: span + 1 }, (_, i) => String(current - i));
}

/** Le bloc académique (niveau + diplôme) est-il obligatoire pour cette variante ? */
export const academicRequired = (v: BackgroundVariant): boolean => v !== "certificat";

/** Situations professionnelles (Pro) — clés canoniques attendues par la RPC v4. */
export const PROFESSIONAL_STATUSES = [
  { value: "salarie", label: "Salarié" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "independant", label: "Indépendant" },
  { value: "demandeur_emploi", label: "Demandeur d'emploi" },
  { value: "autre", label: "Autre" },
] as const;

/** Le poste/fonction est-il obligatoire pour ce statut ? (pas pour demandeur d'emploi / autre) */
export const positionRequiredFor = (status: string): boolean =>
  status === "salarie" || status === "entrepreneur" || status === "independant";

/**
 * Secteurs d'activité — liste générale d'aide à la saisie (Pro), datalist + saisie
 * libre (« Autre »). Volontairement générique (PAS les 8 programmes IPMD Pro).
 */
export const SECTORS = [
  "Informatique & Numérique",
  "Télécommunications",
  "Banque & Assurance",
  "Finance & Comptabilité",
  "Commerce & Distribution",
  "Industrie & Production",
  "BTP & Immobilier",
  "Santé & Social",
  "Éducation & Formation",
  "Administration publique",
  "Transport & Logistique",
  "Agriculture & Agroalimentaire",
  "Énergie & Environnement",
  "Médias & Communication",
  "Marketing & Publicité",
  "Tourisme & Hôtellerie",
  "ONG & Associatif",
  "Juridique",
  "Conseil & Services aux entreprises",
];

/** Spécification du champ « situation / fonction actuelle » selon la variante. */
export type SituationSpec = {
  show: boolean;
  required: boolean;
  label: string;
  placeholder: string;
  hint?: string;
};

export function situationSpec(v: BackgroundVariant): SituationSpec {
  switch (v) {
    case "pro":
      // Pro : remplacé par le bloc professionnel structuré (Step2Parcours) → pas de champ libre.
      return { show: false, required: false, label: "", placeholder: "" };
    case "executive":
      return {
        show: true,
        required: true,
        label: "Fonction actuelle / responsabilités",
        placeholder: "Ex. Directeur, DAF, chef de département, dirigeant…",
      };
    case "certificat":
      return {
        show: true,
        required: false,
        label: "Situation actuelle / activité professionnelle",
        placeholder: "Ex. Étudiant, en recherche d'emploi, salarié, entrepreneur…",
        hint: "Facultatif — aide à mieux vous orienter.",
      };
    default: // campus : pas de champ professionnel
      return { show: false, required: false, label: "", placeholder: "" };
  }
}

/**
 * Erreurs par champ (message court), calculées selon la variante :
 * académique requis pour campus/pro/executive ; situation requise uniquement
 * pour executive.
 */
export function backgroundErrors(
  v: Background,
  variant: BackgroundVariant,
): Partial<Record<keyof Background, string>> {
  const e: Partial<Record<keyof Background, string>> = {};
  if (academicRequired(variant)) {
    if (!v.lastLevel.trim()) e.lastLevel = "Champ obligatoire.";
    if (!v.lastDiploma.trim()) e.lastDiploma = "Champ obligatoire.";
  }
  const sit = situationSpec(variant);
  if (sit.show && sit.required && !v.currentSituation.trim())
    e.currentSituation = "Champ obligatoire.";
  // Bloc professionnel structuré (Pro) : statut obligatoire ; poste conditionnel.
  if (variant === "pro") {
    if (!v.professionalStatus.trim()) e.professionalStatus = "Champ obligatoire.";
    else if (positionRequiredFor(v.professionalStatus) && !v.currentPosition.trim())
      e.currentPosition = "Champ obligatoire.";
  }
  // Années d'expérience (facultatif) : format numérique si renseigné (Pro + Executive).
  if (
    (variant === "pro" || variant === "executive") &&
    v.experienceYears.trim() &&
    !/^\d{1,2}$/.test(v.experienceYears.trim())
  )
    e.experienceYears = "Nombre d'années invalide.";
  return e;
}

export const isBackgroundValid = (v: Background, variant: BackgroundVariant): boolean =>
  Object.keys(backgroundErrors(v, variant)).length === 0;
