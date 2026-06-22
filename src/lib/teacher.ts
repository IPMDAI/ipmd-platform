/** Statuts d'une fiche enseignant. */
export const TEACHER_STATUSES = [
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validé" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "archive", label: "Archivé" },
] as const;

export const TEACHER_STATUS_VALUES: string[] = TEACHER_STATUSES.map(
  (s) => s.value
);

export const TEACHER_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  TEACHER_STATUSES.map((s) => [s.value, s.label])
);

export function teacherStatusClass(status: string): string {
  switch (status) {
    case "valide":
      return "bg-blue-50 text-blue-700";
    case "actif":
      return "bg-green-50 text-green-700";
    case "inactif":
      return "bg-amber-50 text-amber-700";
    case "archive":
      return "bg-black/5 text-black/50";
    default:
      return "bg-ipmd-red/10 text-ipmd-red"; // en_attente
  }
}

/** « Nom — fonction réelle » (titre devant le nom si présent). */
export function teacherDisplay(
  name: string,
  fn?: string | null,
  title?: string | null
): string {
  const base = title ? `${title} ${name}` : name;
  return fn ? `${base} — ${fn}` : base;
}
