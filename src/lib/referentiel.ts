/** Filières standard de l'IPMD (= les formations proposées). */
export const IPMD_FILIERES = [
  "Marketing digital",
  "Communication digitale",
  "Graphisme & Design",
  "Développement d'applications",
  "E-commerce & commerce international",
  "Informatique & intelligence artificielle",
  "Management de projet digital",
  "Comptabilité & finance digitale",
];

/** Niveaux d'étude (LMD). */
export const NIVEAUX = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
];

/** Semestres (LMD : 2 par niveau, S1→S10). */
export const SEMESTERS = [
  "Semestre 1",
  "Semestre 2",
  "Semestre 3",
  "Semestre 4",
  "Semestre 5",
  "Semestre 6",
  "Semestre 7",
  "Semestre 8",
  "Semestre 9",
  "Semestre 10",
];

/** Correspondance Bac+N (programmes) → niveau LMD. */
export const LEVEL_FROM_DEGREE: Record<string, string> = {
  "Bac+1": "Licence 1",
  "Bac+2": "Licence 2",
  "Bac+3": "Licence 3",
  "Bac+4": "Master 1",
  "Bac+5": "Master 2",
};
