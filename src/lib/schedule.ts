/** Jours de la semaine pour l'emploi du temps (1 = Lundi). */
export const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

export const DAY_LABELS: Record<number, string> = Object.fromEntries(
  DAY_OPTIONS.map((d) => [d.value, d.label])
);

/** "08:00:00" → "08:00" */
export function formatTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}
