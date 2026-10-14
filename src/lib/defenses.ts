/**
 * Libellés / badges des soutenances (D8-UI-3), présentation uniquement.
 * Les transitions, l'éligibilité des jurés, les notes finales, mentions et
 * décisions sont gardées par la base (D8-3 + D8-4). Le frontend ne calcule
 * AUCUNE décision et n'invente AUCUN seuil.
 */

export type DefenseStatus = "a_planifier" | "planifiee" | "tenue" | "annulee";
export type ResultStatus = "en_evaluation" | "delibere" | "valide";

export const DEFENSE_STATUS: Record<DefenseStatus, { label: string; cls: string }> = {
  a_planifier: { label: "À planifier", cls: "bg-black/5 text-black/60 ring-1 ring-black/10" },
  planifiee: { label: "Planifiée", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  tenue: { label: "Tenue", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  annulee: { label: "Annulée", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

export const DEFENSE_STATUS_ORDER: DefenseStatus[] = ["a_planifier", "planifiee", "tenue", "annulee"];

export const JURY_ROLES: { value: string; label: string }[] = [
  { value: "president", label: "Président" },
  { value: "rapporteur", label: "Rapporteur" },
  { value: "examinateur", label: "Examinateur" },
  { value: "autre", label: "Autre" },
];
export const JURY_ROLE_LABEL: Record<string, string> = Object.fromEntries(
  JURY_ROLES.map((r) => [r.value, r.label])
);

export const JURY_DECISIONS: { value: string; label: string }[] = [
  { value: "admis", label: "Admis" },
  { value: "admis_reserves", label: "Admis avec réserves" },
  { value: "ajourne", label: "Ajourné" },
  { value: "refuse", label: "Refusé" },
];
export const JURY_DECISION_LABEL: Record<string, string> = Object.fromEntries(
  JURY_DECISIONS.map((d) => [d.value, d.label])
);

export const RESULT_STATUS_LABEL: Record<string, string> = {
  en_evaluation: "En évaluation",
  delibere: "Délibéré (non validé)",
  valide: "Validé",
};

/** « Initiale » pour la 1re tentative, « Reprise n°N » au-delà. */
export function attemptLabel(attempt: number): string {
  return attempt <= 1 ? "Initiale" : `Reprise n°${attempt}`;
}
