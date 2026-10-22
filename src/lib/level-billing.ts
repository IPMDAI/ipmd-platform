/**
 * Conditions commerciales RATTACHÉES AU NIVEAU — module PUR (aucun accès DB).
 *
 * Source de vérité d'IPMD Professionnel pour les PARCOURS INTENSIFS : la scolarité
 * et le plafond d'échéances sont portés par `tuition_levels` (niveau), pas par la
 * classe. Un niveau est « gouverné » dès qu'il porte un `max_installments` (donnée) :
 * identification ROBUSTE, jamais par un libellé codé en dur.
 *
 *  - niveau gouverné (intensif) : scolarité = tuition_levels.amount, la classe est
 *    IGNORÉE ; frais d'inscription = défaut Pro global (300 000) ; plan par défaut
 *    plafonné à `max_installments`.
 *  - niveau classique : comportement HISTORIQUE inchangé (classe prioritaire, repli
 *    tuition_levels ; inscription classe sinon global ; plan par défaut tel quel).
 */

export type LevelRow = { amount: number | null; max_installments: number | null } | null;

export type LevelBilling = {
  tuitionDue: number | null;
  registrationFee: number;
  planMonths: number; // plan PAR DÉFAUT, plafonné par le niveau le cas échéant
  isLevelGoverned: boolean; // true = intensif (tuition_levels = source de vérité)
};

export function resolveLevelBilling(input: {
  levelRow: LevelRow;
  classTuition: number | null;
  classRegistration: number | null;
  globalRegistration: number;
  defaultPlanMonths: number;
}): LevelBilling {
  const { levelRow, classTuition, classRegistration, globalRegistration, defaultPlanMonths } = input;
  const cap = levelRow?.max_installments ?? null;
  const levelAmount = levelRow?.amount != null ? Number(levelRow.amount) : null;

  if (cap != null) {
    // Niveau intensif : conditions rattachées au niveau (classe ignorée).
    return {
      tuitionDue: levelAmount,
      registrationFee: globalRegistration,
      planMonths: Math.min(defaultPlanMonths, cap),
      isLevelGoverned: true,
    };
  }

  // Niveau classique : résolution historique (classe prioritaire, repli niveau).
  return {
    tuitionDue: classTuition != null ? Number(classTuition) : levelAmount,
    registrationFee: classRegistration != null ? Number(classRegistration) : globalRegistration,
    planMonths: defaultPlanMonths,
    isLevelGoverned: false,
  };
}

/** Plafonne un nombre de mensualités par le plafond du niveau (si défini). */
export function capPlanMonths(planMonths: number, cap: number | null | undefined): number {
  return cap != null ? Math.min(planMonths, cap) : planMonths;
}
