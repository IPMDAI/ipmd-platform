/** Motifs d'un message à l'administration. */
export const MESSAGE_CATEGORIES = [
  { value: "question", label: "Question générale" },
  { value: "absence", label: "Justifier une absence" },
  { value: "finance", label: "Scolarité / paiement" },
  { value: "pedagogie", label: "Pédagogie / cours" },
  { value: "autre", label: "Autre" },
] as const;

export const MESSAGE_CATEGORY_VALUES: string[] = MESSAGE_CATEGORIES.map(
  (c) => c.value
);

export const MESSAGE_CATEGORY_LABEL: Record<string, string> =
  Object.fromEntries(MESSAGE_CATEGORIES.map((c) => [c.value, c.label]));

/** Services destinataires de la messagerie officielle. */
export const SERVICES = [
  { value: "admin", label: "Administration" },
  { value: "scolarite", label: "Scolarité" },
  { value: "pedagogie", label: "Pédagogie" },
] as const;

export const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICES.map((s) => [s.value, s.label])
);

/** Rôles qui reçoivent / gèrent la messagerie (boîtes de service). */
export const STAFF_ROLES = ["super_admin", "admin", "scolarite", "pedagogie"];

/** Services qu'un rôle a le droit de contacter (règles IPMD). */
export function servicesForRole(role: string): { value: string; label: string }[] {
  if (role === "parent") {
    return SERVICES.filter((s) => s.value === "admin" || s.value === "scolarite");
  }
  if (role === "etudiant" || role === "professionnel" || role === "dirigeant") {
    return [...SERVICES]; // admin, scolarité, pédagogie
  }
  if (role === "enseignant") {
    return SERVICES.filter((s) => s.value === "admin" || s.value === "pedagogie");
  }
  return SERVICES.filter((s) => s.value === "admin");
}

