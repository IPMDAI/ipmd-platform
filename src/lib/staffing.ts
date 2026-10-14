/**
 * Besoins en personnel (D6) — libellés et badges partagés UI.
 * La logique métier (transitions, droits) vit en base (RPC + RLS + triggers).
 * Côté front : AUCUN pouvoir de décision (valider/refuser/affecter/recruter) —
 * ceux-ci appartiennent à l'Administrateur Général (espace AG, D6-3).
 */

export type StaffingStatus =
  | "brouillon"
  | "en_attente"
  | "validee"
  | "refusee"
  | "affectee"
  | "cloturee";

/** Types de besoin (doit rester aligné avec le CHECK de staffing_requests.need_type). */
export const NEED_TYPES: { value: string; label: string }[] = [
  { value: "enseignant", label: "Enseignant" },
  { value: "assistant", label: "Assistant pédagogique" },
  { value: "personnel_admin", label: "Personnel administratif" },
  { value: "responsable", label: "Responsable" },
  { value: "consultant", label: "Consultant / vacataire" },
  { value: "autre", label: "Autre" },
];

/** Priorités (aligné avec le CHECK de staffing_requests.priority). */
export const PRIORITIES: { value: string; label: string }[] = [
  { value: "basse", label: "Basse" },
  { value: "normale", label: "Normale" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

export const NEED_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  NEED_TYPES.map((t) => [t.value, t.label])
);
export const PRIORITY_LABEL: Record<string, string> = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.label])
);

/** Badge par statut (même esthétique que FINANCIAL_STANDING). */
export const STAFFING_STATUS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: "Brouillon", cls: "bg-black/5 text-black/60 ring-1 ring-black/10" },
  en_attente: { label: "En attente de l'AG", cls: "bg-amber-50 text-amber-700" },
  validee: { label: "Validée", cls: "bg-sky-50 text-sky-700" },
  refusee: { label: "Refusée", cls: "bg-ipmd-red/10 text-ipmd-red" },
  affectee: { label: "Affectée", cls: "bg-green-50 text-green-700" },
  cloturee: { label: "Clôturée", cls: "bg-black/5 text-black/50 ring-1 ring-black/10" },
};

export type StaffingRequestRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  need_type: string;
  position_title: string;
  academic_year: string | null;
  module_id: string | null;
  class_id: string | null;
  justification: string;
  priority: string;
  proposed_profile: string | null;
  status: StaffingStatus;
  decided_at: string | null;
  decision_reason: string | null;
  assigned_profile_name: string | null;
  assigned_at: string | null;
  closed_at: string | null;
};
