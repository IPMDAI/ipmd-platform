/**
 * Validation du SNAPSHOT d'admission avant réutilisation par « Créer & inviter ».
 *
 * Règle stricte : dès qu'un snapshot est présent (class_id figé), AUCUN fallback
 * silencieux n'est autorisé. On exige les 5 champs figés et on revalide la
 * cohérence réelle de la classe (existence, nature diplôme, filière, niveau,
 * année) AVANT toute création de compte / écriture finance.
 *
 * Fonction PURE (aucun I/O) → réutilisée par le serveur ET testable isolément.
 */

export type PackSnapshot = {
  class_id: string | null;
  accepted_level: string | null;
  academic_year: string | null;
  registration_fee: number | null;
  tuition_due: number | null;
};

export type SnapshotClass = {
  id: string;
  filiere_id: string | null;
  level: string | null;
  academic_year: string | null;
  kind: string | null;
} | null;

export type SnapshotCheck = { ok: true } | { ok: false; code: "INCOMPLETE" | "INCOHERENT"; message: string };

const MSG_INCOMPLETE =
  "Snapshot d'admission incomplet (classe, niveau, année ou frais manquants). Reconfirme l'admission avant d'inviter — aucun compte créé, aucune finance écrite.";
const MSG_INCOHERENT =
  "Classe du snapshot incohérente (introuvable, ou niveau/année/filière modifiés depuis la confirmation). Reconfirme l'admission — aucun compte créé, aucune finance écrite.";

/** Un snapshot est-il « présent » (au moins un class_id figé) ? */
export function hasAdmissionSnapshot(snap: { class_id: string | null } | null | undefined): boolean {
  return !!snap?.class_id;
}

/**
 * Valide complétude + cohérence. `cls` = la classe réelle relue depuis la base
 * pour le `class_id` du snapshot (null si introuvable).
 */
export function validateAdmissionSnapshot(snap: PackSnapshot, cls: SnapshotClass): SnapshotCheck {
  // 1. Complétude : les 5 champs figés sont obligatoires.
  if (
    !snap.class_id ||
    !snap.accepted_level ||
    !snap.academic_year ||
    snap.registration_fee == null ||
    snap.tuition_due == null
  ) {
    return { ok: false, code: "INCOMPLETE", message: MSG_INCOMPLETE };
  }
  // 2. Cohérence réelle de la classe figée.
  if (
    !cls ||
    cls.kind !== "diplome" ||
    !cls.filiere_id ||
    cls.level !== snap.accepted_level ||
    cls.academic_year !== snap.academic_year
  ) {
    return { ok: false, code: "INCOHERENT", message: MSG_INCOHERENT };
  }
  return { ok: true };
}
