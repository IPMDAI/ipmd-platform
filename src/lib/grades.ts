type GradeLike = { score: number | string; max_score: number | string };

/** Moyenne ramenée sur 20 à partir des pourcentages. "—" si aucune note. */
export function averageOn20(grades: GradeLike[]): string {
  if (grades.length === 0) return "—";
  const sum = grades.reduce(
    (acc, g) => acc + (Number(g.score) / Number(g.max_score)) * 20,
    0
  );
  return `${Math.round((sum / grades.length) * 100) / 100}/20`;
}
