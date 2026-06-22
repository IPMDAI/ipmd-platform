type GradeLike = {
  score: number | string;
  max_score: number | string;
  coefficient?: number | string | null;
};

/** Types de note (process IPMD : ≥ 2 notes de classe + 1 examen). */
export const GRADE_TYPES = [
  { value: "classe", label: "Note de classe" },
  { value: "examen", label: "Examen" },
];

export const GRADE_TYPE_VALUES = GRADE_TYPES.map((t) => t.value);

export const GRADE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GRADE_TYPES.map((t) => [t.value, t.label])
);

/** Moyenne pondérée (par coefficient), sur 20. null si aucune note. */
export function averageValue(grades: GradeLike[]): number | null {
  if (grades.length === 0) return null;
  let weighted = 0;
  let coefSum = 0;
  for (const g of grades) {
    const coef = g.coefficient != null ? Number(g.coefficient) : 1;
    weighted += (Number(g.score) / Number(g.max_score)) * 20 * coef;
    coefSum += coef;
  }
  if (coefSum === 0) return null;
  return Math.round((weighted / coefSum) * 100) / 100;
}

/** Moyenne pondérée formatée « X/20 ». "—" si aucune note. */
export function averageOn20(grades: GradeLike[]): string {
  const v = averageValue(grades);
  return v === null ? "—" : `${v}/20`;
}

/** Mention selon la moyenne /20. */
export function mention(value: number | null): string {
  if (value === null) return "—";
  if (value >= 16) return "Très bien";
  if (value >= 14) return "Bien";
  if (value >= 12) return "Assez bien";
  if (value >= 10) return "Passable";
  return "Insuffisant";
}
