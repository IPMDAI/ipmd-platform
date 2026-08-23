/**
 * Scolarité & financement (diplômes ivoiriens) — contenu NON FINANCIER de la
 * page /scolarite (documents, matériel, tenue, textes). Modifiable librement.
 *
 * ⚠️ SOURCE UNIQUE FINANCIÈRE : les frais d'inscription, scolarités par niveau,
 * pourcentages et échéancier NE sont PLUS ici. Ils proviennent exclusivement de
 * la base (`tuition_levels` + `finance_settings` + `installment_plan`) via
 * `src/lib/scolarite-data.ts`. Ne jamais réintroduire de grille financière figée.
 */

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
