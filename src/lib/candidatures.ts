/** Statuts du pipeline d'inscription. */
export const CANDIDATURE_STATUSES = [
  { value: "nouveau", label: "Nouveau" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
  { value: "inscrit", label: "Inscrit" },
] as const;

export const CANDIDATURE_STATUS_VALUES: string[] = CANDIDATURE_STATUSES.map(
  (s) => s.value
);

export const CANDIDATURE_LABEL: Record<string, string> = Object.fromEntries(
  CANDIDATURE_STATUSES.map((s) => [s.value, s.label])
);

export function candidatureBadgeClass(status: string): string {
  switch (status) {
    case "accepte":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "refuse":
      return "bg-black/5 text-black/50 ring-1 ring-black/10";
    case "inscrit":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    default: // nouveau
      return "bg-ipmd-red/10 text-ipmd-red ring-1 ring-ipmd-red/20";
  }
}
