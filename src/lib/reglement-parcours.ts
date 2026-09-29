import { isBootcampUniverse } from "@/data/reglement";

// Logique PURE de choix du parcours (bootcamp vs diplôme) — sans I/O, testable.

export type BootcampSignals = {
  /** profiles.universe (libellé admin, parfois vide ou obsolète). */
  profileUniverse: string | null;
  /** univers de la candidature liée (formation réellement choisie/admise). */
  candidatureUniverse: string | null;
  /** marqueur financier historique (student_finance.lump_sum_eligible). */
  lumpSumEligible: boolean | null;
};

/**
 * Décision PURE du parcours. Priorité : la candidature liée (formation réellement
 * choisie et acceptée) PRIME. `profiles.universe` (libellé admin, souvent vide) ne
 * sert qu'à défaut de candidature. Le marqueur financier est l'ultime repli.
 * En cas de CONTRADICTION profiles.universe ↔ candidature, la candidature l'emporte.
 */
export function decideIsBootcamp(s: BootcampSignals): boolean {
  if (s.candidatureUniverse) return isBootcampUniverse(s.candidatureUniverse);
  if (s.profileUniverse) return isBootcampUniverse(s.profileUniverse);
  return s.lumpSumEligible === true;
}

/** Vrai si profiles.universe et la candidature liée classent l'apprenant
 * différemment (bootcamp vs diplôme) — anomalie de données à signaler. */
export function universeMismatch(s: BootcampSignals): boolean {
  if (!s.profileUniverse || !s.candidatureUniverse) return false;
  return isBootcampUniverse(s.profileUniverse) !== isBootcampUniverse(s.candidatureUniverse);
}
