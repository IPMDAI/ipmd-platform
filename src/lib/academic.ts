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

/** Types de classe (public visé). */
export const CLASS_TYPES = [
  { value: "initial", label: "Initial Campus" },
  { value: "pro", label: "Pro / Salarié" },
  { value: "partenaire", label: "Partenaire académique" },
] as const;

export const CLASS_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CLASS_TYPES.map((t) => [t.value, t.label])
);

/** Classe de couleur du badge selon le type de classe. */
export function classTypeBadge(type: string | null): string {
  switch (type) {
    case "pro":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "partenaire":
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
    case "initial":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    default:
      return "bg-ipmd-light text-black/50";
  }
}

/** Régimes de paiement. */
export const PAYMENT_REGIMES = [
  { value: "classique", label: "Paiement classique" },
  { value: "decale", label: "Paiement décalé" },
  { value: "professionnel", label: "Paiement professionnel" },
  { value: "partenaire", label: "Paiement partenaire" },
  { value: "special", label: "Échéancier spécial" },
  { value: "prise_en_charge", label: "Prise en charge" },
] as const;

export const PAYMENT_REGIME_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_REGIMES.map((r) => [r.value, r.label])
);
