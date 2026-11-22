/**
 * Formules & tarifs des bootcamps certifiants — PAR UNIVERS. 5 formules par durée
 * croissante. Source d'affichage (repli) : les mêmes valeurs sont gravées en base
 * (catalog_items is_formula=true). `BootcampFormulas` remplace les montants par
 * ceux de la base dès que les formules passent `open` (activation Lot B), matchés
 * par `durationMonths` → zéro divergence possible entre l'affiché et le facturé.
 *
 * ⚠️ Affichage marketing. Les frais d'inscription NE SONT PAS inclus dans le coût
 * du bootcamp/parcours. La remise « -15 % comptant » n'est PAS annoncée ici tant
 * qu'elle n'est pas effective dans le montant dû (B3).
 */
export type BootcampFormula = {
  id: string;
  title: string;
  duration: string;
  /** Durée en mois — clé de correspondance avec la base (0 = format court). */
  durationMonths: number;
  /** Coût du bootcamp/parcours (hors frais d'inscription). */
  price: string;
  /** Mention éventuelle « À partir de » (court variable des univers standard). */
  pricePrefix?: string;
  registration: string;
  certification?: string;
  /** Facilité de paiement (ex. « Paiement en 3× maximum »). */
  installments?: string;
  /** Bootcamps/thèmes présentés sous la formule (affichage, icône + libellé). */
  bootcamps?: { icon: string; label: string }[];
};

/**
 * Rentrée affichée (bannière marketing) PAR UNIVERS. UltraExecutive a sa propre
 * date ; les autres univers conservent la rentrée par défaut tant qu'elle n'est
 * pas confirmée (à réconcilier au besoin avec les sessions réelles, table `intakes`).
 */
const BOOTCAMP_INTAKE_BY_UNIVERSE: Record<string, string> = {
  ultraexecutive: "24 février 2027",
};
const DEFAULT_BOOTCAMP_INTAKE = "20 octobre 2026";
export function getBootcampIntake(universe: string): string {
  return BOOTCAMP_INTAKE_BY_UNIVERSE[universe] ?? DEFAULT_BOOTCAMP_INTAKE;
}

/** UltraJobs · UltraBoost · SeniorsHub — grille commune (court variable « dès »). */
const STANDARD_FORMULAS: BootcampFormula[] = [
  {
    id: "courte",
    title: "Bootcamp court",
    duration: "moins de 15 heures",
    durationMonths: 0,
    price: "30 000 FCFA",
    pricePrefix: "À partir de",
    registration: "15 000 FCFA",
    certification: "Microcertificat professionnel IPMD",
  },
  {
    id: "un-mois",
    title: "Bootcamp 1 mois",
    duration: "1 mois (30 h)",
    durationMonths: 1,
    price: "385 000 FCFA",
    registration: "50 000 FCFA",
    certification: "Certificat professionnel IPMD — Fondamentaux",
  },
  {
    id: "trois-mois",
    title: "Bootcamp 3 mois",
    duration: "3 mois",
    durationMonths: 3,
    price: "585 000 FCFA",
    registration: "100 000 FCFA",
    certification: "Certificat professionnel métier IPMD",
    installments: "Paiement en 3× maximum",
  },
  {
    id: "six-mois",
    title: "Bootcamp 6 mois",
    duration: "6 mois",
    durationMonths: 6,
    price: "785 000 FCFA",
    registration: "200 000 FCFA",
    certification: "Certificat de compétences professionnelles IPMD",
    installments: "Paiement en 4× maximum",
  },
  {
    id: "parcours",
    title: "Parcours professionnel",
    duration: "3 ans",
    durationMonths: 36,
    price: "2 850 000 FCFA",
    registration: "300 000 FCFA",
    certification: "Certificat supérieur d'expertise professionnelle IPMD",
    installments: "Paiement en 10× maximum",
  },
];

/** UltraExecutive — premium (Essentiel / Avancé / Excellence, court à prix FIXE). */
const EXECUTIVE_FORMULAS: BootcampFormula[] = [
  {
    id: "courte",
    title: "Certificat exécutif — module thématique court",
    duration: "15 jours",
    durationMonths: 0,
    price: "585 000 FCFA",
    registration: "50 000 FCFA",
    certification: "6 à 15 h de formation",
    installments: "Paiement comptant",
  },
  {
    id: "un-mois",
    title: "Certificat exécutif — Essentiel",
    duration: "1 mois",
    durationMonths: 1,
    price: "885 000 FCFA",
    registration: "100 000 FCFA",
    certification: "30 h de formation",
    installments: "Paiement en 2× maximum",
    bootcamps: [
      { icon: "🌐", label: "Écosystème digital & IA" },
      { icon: "🛒", label: "Écosystème E-Business" },
      { icon: "⚡", label: "Écosystème Disruptions" },
    ],
  },
  {
    id: "trois-mois",
    title: "Certificat exécutif — Avancé",
    duration: "3 mois",
    durationMonths: 3,
    price: "2 885 000 FCFA",
    registration: "200 000 FCFA",
    certification: "60 h de formation",
    installments: "Paiement en 3× maximum",
    bootcamps: [
      { icon: "🔄", label: "Transformation digitale" },
      { icon: "🧠", label: "Management numérique & Stratégie IA" },
      { icon: "⭐", label: "Management de l'e-réputation" },
    ],
  },
  {
    id: "six-mois",
    title: "Certificat exécutif — Excellence",
    duration: "6 mois",
    durationMonths: 6,
    price: "4 880 000 FCFA",
    registration: "300 000 FCFA",
    installments: "Paiement en 4× maximum",
    bootcamps: [
      { icon: "🏛️", label: "Gouvernance numérique & IA" },
      { icon: "💥", label: "Gouvernance de la disruption" },
    ],
  },
];

/** UltraBoost · SeniorsHub — grille « certificats professionnels » (specialité). */
const SPECIALITE_FORMULAS: BootcampFormula[] = [
  {
    id: "micro",
    title: "Microcertificat Professionnel",
    duration: "2 à 15 heures",
    durationMonths: 0,
    price: "30 000 FCFA",
    pricePrefix: "À partir de",
    registration: "15 000 FCFA",
    certification: "Microcertificat Professionnel IPMD",
    installments: "Paiement en 1 fois",
  },
  {
    id: "professionnel",
    title: "Certificat Professionnel",
    duration: "30 h · 1 mois",
    durationMonths: 1,
    price: "385 000 FCFA",
    registration: "50 000 FCFA",
    certification: "Certificat Professionnel IPMD",
    installments: "Paiement en 2× maximum",
  },
  {
    id: "metier",
    title: "Certificat Professionnel Métier / Reconversion",
    duration: "90 h · 3 mois",
    durationMonths: 3,
    price: "585 000 FCFA",
    registration: "100 000 FCFA",
    certification: "Certificat Professionnel Métier / Reconversion IPMD",
    installments: "Paiement en 3× maximum",
  },
  {
    id: "competences",
    title: "Certificat de Compétences Professionnelles",
    duration: "180 h · 6 mois",
    durationMonths: 6,
    price: "1 550 000 FCFA",
    registration: "200 000 FCFA",
    certification: "Certificat de Compétences Professionnelles IPMD",
    installments: "Paiement en 4× maximum",
  },
  {
    id: "expertise",
    title: "Certificat Supérieur d'Expertise Professionnelle",
    duration: "280 h · 10 mois",
    durationMonths: 10,
    price: "2 850 000 FCFA",
    registration: "300 000 FCFA",
    certification: "Certificat Supérieur d'Expertise Professionnelle IPMD",
    installments: "Paiement en 6× maximum",
  },
];

/** Grille des 5 formules pour un univers donné. */
export function getBootcampFormulas(universe: string): BootcampFormula[] {
  if (universe === "ultraexecutive") return EXECUTIVE_FORMULAS;
  if (universe === "ultraboost" || universe === "seniorshub") return SPECIALITE_FORMULAS;
  return STANDARD_FORMULAS;
}
