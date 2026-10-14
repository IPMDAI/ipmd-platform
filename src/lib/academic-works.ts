/**
 * Libellés / badges des travaux académiques (D8-UI-2), présentation uniquement.
 * Les transitions et validations sont gardées par la base (RLS + RPC D8-2).
 */

export type WorkType = "memoire" | "rapport_stage" | "pfe";
export type WorkStatus =
  | "brouillon"
  | "a_deposer"
  | "depose"
  | "valide"
  | "a_corriger"
  | "annule";

export const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: "memoire", label: "Mémoire" },
  { value: "rapport_stage", label: "Rapport de stage" },
  { value: "pfe", label: "Projet de fin d'études (PFE)" },
];

export const WORK_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  WORK_TYPES.map((t) => [t.value, t.label])
);

export const WORK_STATUS: Record<WorkStatus, { label: string; cls: string }> = {
  brouillon: { label: "Brouillon", cls: "bg-black/5 text-black/60 ring-1 ring-black/10" },
  a_deposer: { label: "À déposer", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  depose: { label: "Déposé", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  valide: { label: "Validé", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  a_corriger: { label: "À corriger", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  annule: { label: "Annulé", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

export const WORK_STATUS_ORDER: WorkStatus[] = [
  "brouillon",
  "a_deposer",
  "depose",
  "a_corriger",
  "valide",
  "annule",
];

export function workTypeLabel(v: string): string {
  return WORK_TYPE_LABEL[v] ?? v;
}
export function workStatusLabel(v: string): string {
  return WORK_STATUS[v as WorkStatus]?.label ?? v;
}
