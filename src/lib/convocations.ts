/** Statuts d'une convocation + rendu badge. */
export const CONVOCATION_STATUS: Record<string, { label: string; cls: string }> = {
  envoyee: { label: "Envoyée", cls: "bg-amber-50 text-amber-800" },
  vue: { label: "Vue", cls: "bg-blue-50 text-blue-700" },
  honoree: { label: "Honorée", cls: "bg-green-50 text-green-700" },
  annulee: { label: "Annulée", cls: "bg-black/5 text-black/45" },
};

export type Convocation = {
  id: string;
  student_id: string;
  title: string;
  reason: string | null;
  scheduled_at: string | null;
  location: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
};

/** Date/heure du rendez-vous (ou null) au format FR lisible. */
export function convocationWhen(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}
