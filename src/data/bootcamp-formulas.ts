/**
 * Formules & tarifs des bootcamps certifiants — COMMUNES aux univers certifiants
 * (UltraJobs, UltraBoost, SeniorsHub). 5 formules par durée croissante.
 *
 * ⚠️ Affichage marketing. Les frais d'inscription NE SONT PAS inclus dans le coût
 * de la formation. L'alignement du flux d'admission/paiement se fait à part.
 */
export type BootcampFormula = {
  id: string;
  title: string;
  duration: string;
  /** Coût de la formation (hors frais d'inscription). */
  price: string;
  /** Mention éventuelle « à partir de ». */
  pricePrefix?: string;
  registration: string;
  certification: string;
  /** Facilité de paiement (ex. « en 3× maximum »). */
  installments?: string;
};

export const BOOTCAMP_INTAKE = "20 octobre 2026";

export const BOOTCAMP_FORMULAS: BootcampFormula[] = [
  {
    id: "courte",
    title: "Formation courte",
    duration: "moins de 15 heures",
    price: "30 000 FCFA",
    pricePrefix: "À partir de",
    registration: "15 000 FCFA",
    certification: "Microcertificat professionnel IPMD",
  },
  {
    id: "un-mois",
    title: "Formation 1 mois",
    duration: "30 heures",
    price: "385 000 FCFA",
    registration: "50 000 FCFA",
    certification: "Certificat professionnel IPMD — Fondamentaux",
  },
  {
    id: "trois-mois",
    title: "Bootcamp 3 mois",
    duration: "3 mois",
    price: "585 000 FCFA",
    registration: "100 000 FCFA",
    certification: "Certificat professionnel métier IPMD",
    installments: "Paiement en 3× maximum",
  },
  {
    id: "six-mois",
    title: "Bootcamp 6 mois",
    duration: "6 mois",
    price: "785 000 FCFA",
    registration: "200 000 FCFA",
    certification: "Certificat de compétences professionnelles IPMD",
    installments: "Paiement en 4× maximum",
  },
  {
    id: "parcours-3-ans",
    title: "Parcours professionnel",
    duration: "3 ans",
    price: "2 850 000 FCFA",
    registration: "300 000 FCFA",
    certification: "Certificat supérieur d'expertise professionnelle IPMD",
    installments: "Paiement en 10× maximum",
  },
];
