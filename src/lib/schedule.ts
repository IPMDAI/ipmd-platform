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

/** Statuts d'un créneau d'emploi du temps. */
export const SLOT_STATUSES = [
  { value: "prevu", label: "Prévu" },
  { value: "reporte", label: "Reporté" },
  { value: "annule", label: "Annulé" },
  { value: "termine", label: "Terminé" },
] as const;

export const SLOT_STATUS_VALUES: string[] = SLOT_STATUSES.map((s) => s.value);

export const SLOT_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  SLOT_STATUSES.map((s) => [s.value, s.label])
);

export function slotStatusClass(status: string): string {
  switch (status) {
    case "reporte":
      return "bg-amber-50 text-amber-700";
    case "annule":
      return "bg-ipmd-red/10 text-ipmd-red";
    case "termine":
      return "bg-green-50 text-green-700";
    default:
      return "bg-black/5 text-black/50"; // prévu
  }
}
