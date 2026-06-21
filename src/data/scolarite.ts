/**
 * Scolarité & financement (diplômes ivoiriens).
 * Données affichées sur la page /scolarite. Modifiable librement.
 */

/** En-têtes du tableau des frais (versements). */
export const feeColumns = [
  { label: "Total", pct: "100 %" },
  { label: "1er", pct: "15 %" },
  { label: "2ᵉ", pct: "15 %" },
  { label: "3ᵉ", pct: "15 %" },
  { label: "4ᵉ", pct: "10 %" },
  { label: "5ᵉ", pct: "10 %" },
  { label: "6ᵉ", pct: "10 %" },
  { label: "7ᵉ", pct: "10 %" },
  { label: "8ᵉ", pct: "5 %" },
  { label: "9ᵉ", pct: "5 %" },
  { label: "10ᵉ", pct: "5 %" },
];

/** Lignes du tableau des frais (en FCFA). */
export const feeRows = [
  {
    level: "Licence 1",
    values: [
      "1 850 000", "277 500", "277 500", "277 500", "185 000", "185 000",
      "185 000", "185 000", "92 500", "92 500", "92 500",
    ],
  },
  {
    level: "Licence 2",
    values: [
      "1 850 000", "277 500", "277 500", "277 500", "185 000", "185 000",
      "185 000", "185 000", "92 500", "92 500", "92 500",
    ],
  },
  {
    level: "Licence 3",
    values: [
      "2 550 000", "382 500", "382 500", "382 500", "255 000", "255 000",
      "255 000", "255 000", "127 500", "127 500", "127 500",
    ],
  },
  {
    level: "Master 1",
    values: [
      "2 850 000", "427 500", "427 500", "427 500", "285 000", "285 000",
      "285 000", "285 000", "142 500", "142 500", "142 500",
    ],
  },
  {
    level: "Master 2",
    values: [
      "2 850 000", "427 500", "427 500", "427 500", "285 000", "285 000",
      "285 000", "285 000", "142 500", "142 500", "142 500",
    ],
  },
];

/** Documents requis pour la candidature. */
export const requiredDocuments = [
  "Relevé de notes du baccalauréat",
  "Relevé de notes de première et terminale (pour nouveaux bacheliers)",
  "Relevé de notes de BAC+1 (entrée directe en L2)",
  "Relevé de notes de BAC+1 et BAC+2 (entrée directe en Licence 3)",
  "Relevé de notes de BAC+1 à BAC+3 (entrée directe en Master 1)",
  "Diplôme(s) obtenu(s)",
  "Attestation de travail et CV (pour les salariés)",
  "Extrait d'acte de naissance et une photo d'identité",
  "CNI, attestation d'identité, carte consulaire ou passeport",
];

export const documentsNote =
  "Pour les étudiants qui prévoient de poursuivre leurs études à l'étranger chez nos partenaires : fournir la copie des cinq premières pages du passeport avant le 30 décembre de l'année en cours.";

/** Caractéristiques minimales de l'ordinateur. */
export const computerSpecs = "Core i5, 16 Go de RAM et 1 To ou 250 Go SSD";

/** Tenue vestimentaire exigée (étudiants en journée). */
export const dressCode = [
  {
    day: "Lundi & Mardi",
    rule: "Femme : ensemble tailleur (veste + pantalon ou jupe) au choix. Homme : costume au choix.",
  },
  { day: "Mercredi", rule: "Vêtements au choix." },
  { day: "Jeudi", rule: "Tee-shirt de l'IPMD." },
  { day: "Vendredi", rule: "Polo de l'IPMD." },
];

/** Frais d'inscription et conditions de paiement. */
export const enrollmentNotes = [
  "Les frais d'inscription s'élèvent à 300 000 FCFA et ne sont pas inclus dans les frais de scolarité.",
  "Possibilité de payer la scolarité en 10 mois (échéancier ci-dessus).",
  "Paiement unique : 15 % de réduction.",
];
