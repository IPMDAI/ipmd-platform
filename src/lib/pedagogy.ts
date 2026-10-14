/**
 * D7-1 — Pilotage pédagogique (lecture seule). Libellés/badges partagés et
 * petits utilitaires. AUCUNE logique d'affectation ici (c'est D7-2). On ne
 * qualifie JAMAIS une charge de « surchargée/sous-chargée » : IPMD n'a pas de
 * seuil contractuel officiel → on n'affiche que du factuel.
 */

/** Badge du statut pédagogique (teacher_profiles.status, cf. src/lib/teacher.ts). */
export const TEACHER_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-50 text-amber-700" },
  valide: { label: "Validé", cls: "bg-sky-50 text-sky-700" },
  actif: { label: "Actif", cls: "bg-green-50 text-green-700" },
  inactif: { label: "Inactif", cls: "bg-black/5 text-black/50 ring-1 ring-black/10" },
  archive: { label: "Archivé", cls: "bg-black/5 text-black/40 ring-1 ring-black/10" },
};

/** « Autorisé/actif » pédagogiquement = statut validé ou actif (règle vérifiée). */
export const TEACHING_ACTIVE_STATUSES = new Set(["valide", "actif"]);

/** Statuts de séance « non tenue » (ni prévue ni réalisée). */
export const SESSION_NOT_HELD = new Set([
  "annulee",
  "reportee",
  "absence_prof",
  "absence_classe",
]);

/** Durée en heures entre deux "HH:MM" (0 si invalide). */
export function hoursBetween(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const d = toMin(end) - toMin(start);
  return d > 0 ? Math.round((d / 60) * 100) / 100 : 0;
}

/** Deux créneaux (même enseignant) se chevauchent-ils le même jour ? */
export function slotsOverlap(
  a: { day_of_week: number; start_time: string; end_time: string },
  b: { day_of_week: number; start_time: string; end_time: string }
): boolean {
  if (a.day_of_week !== b.day_of_week) return false;
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

export type PedagogicalTeacher = {
  profile_id: string;
  full_name: string | null;
  fonction: string | null;
  specialite: string | null;
  statut: string | null;
  autorisation: string | null;
};
