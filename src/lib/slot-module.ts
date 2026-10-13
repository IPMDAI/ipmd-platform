import { moduleRequirement } from "./schedule.ts";

/** Module relu côté serveur pour le `module_id` fourni (null si absent/introuvable). */
export type SlotModuleRow = {
  id: string;
  name: string;
  status: string;
  filiere_id: string | null;
  level: string | null;
  academic_year: string | null;
} | null;

export type SlotModuleCtx = {
  type: string;
  moduleId: string | null;
  module: SlotModuleRow; // relu par le serveur à partir de moduleId
  freeSubject: string; // intitulé libre saisi au formulaire
  classFiliereId: string | null;
  classLevel: string | null;
  classYear: string | null;
};

export type SlotModuleResolution =
  | { ok: true; subject: string; moduleId: string | null }
  | { ok: false; message: string };

/**
 * Décide, pour un créneau/séance, le `subject` final et le `module_id` à stocker.
 * Règle académique stricte : pour les types « module requis », le libellé est
 * IMPOSÉ par le nom du module (le client ne peut pas envoyer un autre nom), et
 * le module doit appartenir à la filière + niveau + année de la classe, et être
 * `actif` (jamais `reserve`/`en_attente`). Fonction PURE → testable.
 */
export function resolveSlotModule(c: SlotModuleCtx): SlotModuleResolution {
  const req = moduleRequirement(c.type);

  // Hors module : jamais de module, intitulé libre requis.
  if (req === "none") {
    const subj = c.freeSubject.trim();
    if (!subj) return { ok: false, message: "Un intitulé est requis." };
    return { ok: true, subject: subj, moduleId: null };
  }

  // Type académique mais classe sans filière → impossible de rattacher un module.
  if (req === "required" && !c.classFiliereId) {
    return {
      ok: false,
      message:
        "Cette classe n'est rattachée à aucune filière. Impossible de sélectionner un module officiel.",
    };
  }

  const wantsModule = req === "required" || (req === "optional" && !!c.moduleId);

  // Facultatif sans module choisi → intitulé libre.
  if (!wantsModule) {
    const subj = c.freeSubject.trim();
    if (!subj) return { ok: false, message: "Un intitulé est requis." };
    return { ok: true, subject: subj, moduleId: null };
  }

  // Un module est attendu : validation serveur stricte.
  if (!c.moduleId) {
    return {
      ok: false,
      message:
        "Pour ce type de séance, un module officiel de la maquette doit être sélectionné.",
    };
  }
  const m = c.module;
  if (!m) return { ok: false, message: "Module introuvable." };
  if (m.status !== "actif") {
    return {
      ok: false,
      message:
        "Ce module n'est pas actif (réservé ou à valider) : il ne peut pas être mis au planning officiel.",
    };
  }
  if (
    m.filiere_id !== c.classFiliereId ||
    m.level !== c.classLevel ||
    m.academic_year !== c.classYear
  ) {
    return {
      ok: false,
      message:
        "Ce module n'appartient pas à la filière, au niveau ou à l'année académique de cette classe.",
    };
  }
  // Libellé IMPOSÉ = nom du module (snapshot), liaison réelle via module_id.
  return { ok: true, subject: m.name, moduleId: m.id };
}
