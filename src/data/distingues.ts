/**
 * Tableau d'honneur — meilleurs étudiants de l'IPMD.
 *
 * 👉 Pour ajouter un étudiant, ajoutez un objet dans `distinguishedStudents`.
 *    Les étudiants sont regroupés automatiquement par année → niveau → filière.
 *    La photo est optionnelle (déposer dans public/distingues/, sinon initiales).
 */
export type DistinguishedStudent = {
  id: string;
  name: string;
  /** Année scolaire, ex. « 2024-2025 ». */
  year: string;
  /** Niveau, ex. « Licence 1 », « Master 2 ». */
  level: string;
  /** Filière, ex. « Marketing digital ». */
  filiere: string;
  /** Distinction, ex. « Major de promotion », « Félicitations du jury ». */
  mention?: string;
  /** Moyenne, ex. « 17,5 / 20 ». */
  average?: string;
  /** Chemin de la photo (public/distingues/...). */
  photo?: string;
  /** Petit commentaire optionnel. */
  note?: string;
};

/** Ordre d'affichage des niveaux. */
export const LEVEL_ORDER = [
  "Licence 1", "Licence 2", "Licence 3",
  "Bachelor 1", "Bachelor 2", "Bachelor 3",
  "Master 1", "Master 2",
  "MBA", "Executive",
];

export const levelRank = (level: string): number => {
  const i = LEVEL_ORDER.indexOf(level);
  return i === -1 ? 999 : i;
};

// ⬇️ Les meilleurs étudiants seront ajoutés ici.
export const distinguishedStudents: DistinguishedStudent[] = [];
