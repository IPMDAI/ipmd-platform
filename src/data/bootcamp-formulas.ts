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
  certification: string;
  /** Facilité de paiement (ex. « Paiement en 3× maximum »). */
  installments?: string;
};

export const BOOTCAMP_INTAKE = "20 octobre 2026";

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

/** UltraExecutive — premium (court à prix FIXE 385 000, pas de « dès »). */
const EXECUTIVE_FORMULAS: BootcampFormula[] = [
  {
    id: "courte",
    title: "Bootcamp court",
    duration: "format court",
    durationMonths: 0,
    price: "385 000 FCFA",
    registration: "50 000 FCFA",
    certification: "Microcertificat professionnel IPMD",
  },
  {
    id: "un-mois",
    title: "Bootcamp 1 mois",
    duration: "1 mois",
    durationMonths: 1,
    price: "850 000 FCFA",
    registration: "100 000 FCFA",
    certification: "Certificat professionnel IPMD — Fondamentaux",
    installments: "Paiement en 2× maximum",
  },
  {
    id: "trois-mois",
    title: "Bootcamp 3 mois",
    duration: "3 mois",
    durationMonths: 3,
    price: "1 550 000 FCFA",
    registration: "200 000 FCFA",
    certification: "Certificat professionnel métier IPMD",
    installments: "Paiement en 3× maximum",
  },
  {
    id: "six-mois",
    title: "Bootcamp 6 mois",
    duration: "6 mois",
    durationMonths: 6,
    price: "2 550 000 FCFA",
    registration: "300 000 FCFA",
    certification: "Certificat de compétences professionnelles IPMD",
    installments: "Paiement en 4× maximum",
  },
  {
    id: "parcours",
    title: "Parcours professionnel",
    duration: "10 mois",
    durationMonths: 10,
    price: "3 550 000 FCFA",
    registration: "500 000 FCFA",
    certification: "Certificat supérieur d'expertise professionnelle IPMD",
    installments: "Paiement en 10× maximum",
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
