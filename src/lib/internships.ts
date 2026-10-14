/**
 * Libellés / badges des stages (D8-UI-1), côté présentation uniquement.
 * Aucune règle métier ici : les transitions et validations sont gardées par la
 * base (RLS + RPC + triggers D8-1). Ce module ne sert qu'à l'affichage.
 */

export type InternshipStatus =
  | "brouillon"
  | "a_valider"
  | "valide"
  | "en_cours"
  | "termine"
  | "annule";

export const INTERNSHIP_STATUS: Record<
  InternshipStatus,
  { label: string; cls: string }
> = {
  brouillon: { label: "Brouillon", cls: "bg-black/5 text-black/60 ring-1 ring-black/10" },
  a_valider: { label: "À valider", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  valide: { label: "Validé", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  en_cours: { label: "En cours", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  termine: { label: "Terminé", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  annule: { label: "Annulé", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

export const INTERNSHIP_STATUS_ORDER: InternshipStatus[] = [
  "brouillon",
  "a_valider",
  "valide",
  "en_cours",
  "termine",
  "annule",
];

export function internshipStatusLabel(status: string): string {
  return INTERNSHIP_STATUS[status as InternshipStatus]?.label ?? status;
}
