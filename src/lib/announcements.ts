/** Audiences possibles d'une annonce. */
export const AUDIENCES = [
  { value: "all", label: "Tout le monde" },
  { value: "etudiant", label: "Étudiants" },
  { value: "parent", label: "Parents" },
  { value: "enseignant", label: "Enseignants" },
] as const;

export const AUDIENCE_VALUES: string[] = AUDIENCES.map((a) => a.value);

export const AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCES.map((a) => [a.value, a.label])
);

/** Groupe d'audience d'un rôle (les apprenants = « etudiant »). */
export function groupForRole(role: string): string {
  if (role === "etudiant" || role === "professionnel" || role === "dirigeant")
    return "etudiant";
  if (role === "parent") return "parent";
  if (role === "enseignant") return "enseignant";
  return "admin";
}

/** Une annonce est-elle pertinente pour ce rôle ? */
export function isForRole(audience: string, role: string): boolean {
  if (role === "admin" || role === "super_admin") return true;
  return audience === "all" || audience === groupForRole(role);
}
