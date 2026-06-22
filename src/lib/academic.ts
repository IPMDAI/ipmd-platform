/** Statuts de validation académique (gouvernance IPMD). */
export const ACADEMIC_STATUSES: { value: string; label: string }[] = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_attente", label: "En attente de validation" },
  { value: "correction", label: "Correction demandée" },
  { value: "valide", label: "Validé" },
  { value: "actif", label: "Activé" },
  { value: "refuse", label: "Refusé" },
  { value: "archive", label: "Archivé" },
];

export const ACADEMIC_STATUS_VALUES = ACADEMIC_STATUSES.map((s) => s.value);

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ACADEMIC_STATUSES.map((s) => [s.value, s.label])
);

/** Statuts réservés au Super Admin (validation finale). */
export const SUPER_ONLY_STATUSES = ["valide", "actif", "refuse", "archive"];

/** Classes de couleur du badge selon le statut. */
export function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "actif":
    case "valide":
      return "bg-green-600/10 text-green-700";
    case "en_attente":
    case "correction":
      return "bg-amber-500/15 text-amber-700";
    case "refuse":
      return "bg-ipmd-red/10 text-ipmd-red";
    case "archive":
      return "bg-black/5 text-black/40";
    default:
      return "bg-ipmd-light text-black/50";
  }
}
