/**
 * Rôles « encadrement académique » autorisés à gérer convocations, documents à
 * fournir, etc. Inclut `directeur_etudes` (D2). Distinct de `STAFF_ROLES`
 * (messagerie) que l'on ne modifie pas : le DÉ ne gère pas les boîtes de service.
 */
export const ACADEMIC_STAFF_ROLES = [
  "super_admin",
  "admin",
  "scolarite",
  "pedagogie",
  "directeur_etudes",
];

/** Statuts de validation académique (gouvernance IPMD). */
export const ACADEMIC_STATUSES: { value: string; label: string }[] = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_attente", label: "En attente de validation" },
  { value: "correction", label: "Correction demandée" },
  { value: "valide", label: "Validé" },
  { value: "actif", label: "Activé" },
  { value: "refuse", label: "Refusé" },
  { value: "archive", label: "Archivé" },
  // Module conservé en base mais NON affecté à une maquette (ni S5, ni S6,
  // ni à valider). Semestre/UE/crédits nuls tant qu'il n'est pas ré-affecté.
  { value: "reserve", label: "En réserve (non affecté)" },
];

export const ACADEMIC_STATUS_VALUES = ACADEMIC_STATUSES.map((s) => s.value);

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ACADEMIC_STATUSES.map((s) => [s.value, s.label])
);

/** Statuts réservés au Super Admin (validation finale + mise en réserve). */
export const SUPER_ONLY_STATUSES = ["valide", "actif", "refuse", "archive", "reserve"];

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
    case "reserve":
      return "bg-black/5 text-black/40";
    default:
      return "bg-ipmd-light text-black/50";
  }
}

/** Types de classe (public visé). */
export const CLASS_TYPES = [
  { value: "initial", label: "Initial Campus" },
  { value: "pro", label: "Formation pour professionnels en activité" },
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

/** Nature d'une classe : cursus diplômant ou session bootcamp. */
export const CLASS_KINDS = [
  { value: "diplome", label: "Diplôme (cursus)" },
  { value: "bootcamp", label: "Bootcamp (session)" },
] as const;

export const CLASS_KIND_LABEL: Record<string, string> = Object.fromEntries(
  CLASS_KINDS.map((k) => [k.value, k.label])
);

/** Mode de formation. */
export const FORMATION_MODES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "distance", label: "À distance" },
  { value: "hybride", label: "Hybride" },
] as const;

export const FORMATION_MODE_LABEL: Record<string, string> = Object.fromEntries(
  FORMATION_MODES.map((m) => [m.value, m.label])
);

/** Nombre de versements autorisés (1 à 5). */
export const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5] as const;

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

/** Rôle d'un parent vis-à-vis de l'élève. */
export const PARENT_RELATIONSHIPS = [
  { value: "pere", label: "Père" },
  { value: "mere", label: "Mère" },
  { value: "tuteur", label: "Tuteur" },
  { value: "tutrice", label: "Tutrice" },
  { value: "autre", label: "Autre" },
] as const;

export const PARENT_RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(
  PARENT_RELATIONSHIPS.map((r) => [r.value, r.label])
);

/**
 * Civilité (titre) — distincte de la relation parent/enfant.
 * « Autre » laisse saisir un titre libre. Jamais déduite automatiquement.
 */
export const CIVILITIES = [
  { value: "M.", label: "M." },
  { value: "Mme", label: "Mme" },
  { value: "Dr", label: "Dr" },
  { value: "Pr", label: "Pr" },
  { value: "Me", label: "Me (Maître)" },
  { value: "autre", label: "Autre…" },
] as const;

export const CIVILITY_VALUES: string[] = CIVILITIES.map((c) => c.value);

/**
 * Email « placeholder » d'import (anciens étudiants sans vraie adresse) :
 * `prenom.nom.NN@archiveAAAA.ipmd.local`. Jamais à montrer à un parent/élève.
 */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const e = email.toLowerCase();
  return e.endsWith(".ipmd.local") || /@(archive|import)/.test(e);
}

/** Email affichable (sinon null) : masque les adresses d'import fictives. */
export function displayEmail(email: string | null | undefined): string | null {
  return isPlaceholderEmail(email) ? null : (email as string);
}

/**
 * Affichage officiel IPMD : « [Civilité] NOM Prénom(s) ».
 * Convention : NOM en premier, puis prénom(s). Civilité facultative.
 * Ex. ("Dr", "KOUASSI", "Jean Marc") → "Dr KOUASSI Jean Marc".
 */
export function formatOfficialName(
  civility: string | null | undefined,
  lastName: string | null | undefined,
  firstNames: string | null | undefined
): string {
  return [civility, lastName, firstNames]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
