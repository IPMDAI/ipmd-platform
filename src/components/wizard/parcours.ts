import { getUniverse } from "@/data/universes";
import type { Universe, UniverseId } from "@/types";

/**
 * Les 7 parcours proposés à l'Étape 0 du wizard d'admission.
 *
 * ⚠️ Volontairement SANS « entreprise » (offre B2B, tunnel distinct).
 * L'ordre suit la logique d'orientation : diplômes d'abord (Campus → Pro →
 * Executive), puis bootcamps certifiants (UltraJobs → UltraBoost →
 * UltraExecutive → SeniorsHub). Réutilise `universes` comme source unique de
 * vérité (nom, accroche, icône, nature) — rien n'est codé en double.
 */
export const WIZARD_PARCOURS_IDS: UniverseId[] = [
  "campus",
  "professionnel",
  "gouvernance",
  "ultrajobs",
  "ultraboost",
  "ultraexecutive",
  "seniorshub",
];

export const wizardParcours: Universe[] = WIZARD_PARCOURS_IDS.map(
  (id) => getUniverse(id)!,
);

/** Un id de parcours fait-il partie du wizard ? (garde de cohérence) */
export const isWizardParcours = (id: string): id is UniverseId =>
  (WIZARD_PARCOURS_IDS as string[]).includes(id);
