/** Statuts d'une séance datée. */
export const SESSION_STATUSES = [
  { value: "prevue", label: "Prévue" },
  { value: "realisee", label: "Réalisée" },
  { value: "reportee", label: "Reportée" },
  { value: "annulee", label: "Annulée" },
  { value: "remplacee", label: "Remplacée" },
  { value: "ferie", label: "Jour férié" },
  { value: "absence_prof", label: "Absence enseignant" },
  { value: "absence_classe", label: "Absence classe" },
] as const;

export const SESSION_STATUS_VALUES: string[] = SESSION_STATUSES.map(
  (s) => s.value
);

export const SESSION_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  SESSION_STATUSES.map((s) => [s.value, s.label])
);

export function sessionStatusClass(status: string): string {
  switch (status) {
    case "realisee":
      return "bg-green-50 text-green-700";
    case "reportee":
    case "remplacee":
      return "bg-amber-50 text-amber-700";
    case "annulee":
    case "absence_prof":
    case "absence_classe":
      return "bg-ipmd-red/10 text-ipmd-red";
    case "ferie":
      return "bg-black/5 text-black/50";
    default:
      return "bg-blue-50 text-blue-700"; // prévue
  }
}

/** Statuts comptés comme heures effectuées (base pour la paie). */
export const DONE_STATUSES = ["realisee", "remplacee"];
