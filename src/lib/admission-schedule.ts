/**
 * Snapshot financier d'admission (Lot Finance F2) — module PUR (aucun accès DB).
 *
 * Fige, à « Confirmer l'admission », l'échéancier depuis les sources LIVE :
 *  - scolarité officielle = tuition_levels/classes (jamais codée en dur) ;
 *  - 10 tranches depuis `installment_plan` (pct + due_date) ;
 *  - montants calculés = tuition_net × pct, dernière tranche ajustée pour
 *    garantir somme(montants) = tuition_net exact ;
 *  - option par défaut « echelonne », discount_rate 0, tuition_net = officielle ;
 *  - remise comptant disponible = finance_settings.lump_sum_discount ;
 *  - deadline comptant = date de la 1re tranche (T1).
 *
 * Le calcul est pur : la lecture DB (installment_plan, lump_sum_discount) est
 * faite par l'appelant serveur (candidature-actions.sendAdmission) et injectée ici.
 */

export type PlanRow = { seq: number; pct: number; due_date: string };

export type ScheduleInstallment = { seq: number; pct: number; due_date: string; amount: number };

export type ScheduleSnapshot = {
  academic_year: string;
  level: string;
  registration_fee: number;
  tuition_official: number;
  payment_option: "echelonne"; // F2 : défaut ; le choix candidat viendra en F3
  discount_rate: 0;
  tuition_net: number; // = tuition_official en échelonné
  lump_sum_discount: number; // remise comptant DISPONIBLE (non appliquée en F2)
  comptant_amount: number; // scolarité potentielle si comptant
  comptant_deadline: string; // = due_date de T1
  installments: ScheduleInstallment[];
};

export type ScheduleResult =
  | { ok: true; schedule: ScheduleSnapshot }
  | { ok: false; code: "PLAN_MANQUANT" | "PLAN_INVALIDE" | "TARIF_MANQUANT"; message: string };

/** Le gabarit d'une année est-il exactement 10 tranches sommant à 100 % ? */
export function validatePlan(rows: PlanRow[]): boolean {
  if (rows.length !== 10) return false;
  const sum = rows.reduce((a, r) => a + Number(r.pct), 0);
  return Math.round(sum) === 100;
}

/**
 * Construit le snapshot. `planRows` vient de `installment_plan` (année),
 * `lumpSumDiscount` de `finance_settings`. Bloque proprement si invalide.
 */
export function buildScheduleSnapshot(input: {
  academicYear: string | null;
  level: string | null;
  registrationFee: number;
  tuitionOfficial: number | null;
  lumpSumDiscount: number;
  planRows: PlanRow[];
}): ScheduleResult {
  const { academicYear, level, registrationFee, tuitionOfficial, lumpSumDiscount } = input;

  if (tuitionOfficial == null || !(tuitionOfficial > 0)) {
    return {
      ok: false,
      code: "TARIF_MANQUANT",
      message:
        "Scolarité inconnue pour ce niveau : renseigne le tarif (Classes & filières / niveaux) avant d'envoyer l'admission.",
    };
  }
  if (!input.planRows || input.planRows.length === 0) {
    return {
      ok: false,
      code: "PLAN_MANQUANT",
      message: `Aucun échéancier configuré pour l'année ${academicYear ?? "active"} : configure les 10 tranches (installment_plan) avant l'admission.`,
    };
  }
  if (!validatePlan(input.planRows)) {
    return {
      ok: false,
      code: "PLAN_INVALIDE",
      message: `Échéancier ${academicYear ?? ""} invalide : il faut exactement 10 tranches dont la somme des pourcentages = 100 %.`,
    };
  }

  const rows = [...input.planRows].sort((a, b) => a.seq - b.seq);
  const tuitionNet = tuitionOfficial; // échelonné par défaut : pas de remise

  // Montants : round(tuition_net × pct) ; dernière tranche = reste exact.
  let cumul = 0;
  const installments: ScheduleInstallment[] = rows.map((r, i) => {
    let amount: number;
    if (i < rows.length - 1) {
      amount = Math.round((tuitionNet * Number(r.pct)) / 100);
      cumul += amount;
    } else {
      amount = tuitionNet - cumul; // ajustement dernière tranche → somme exacte
    }
    return { seq: r.seq, pct: Number(r.pct), due_date: r.due_date, amount };
  });

  return {
    ok: true,
    schedule: {
      academic_year: academicYear ?? "",
      level: level ?? "",
      registration_fee: registrationFee,
      tuition_official: tuitionOfficial,
      payment_option: "echelonne",
      discount_rate: 0,
      tuition_net: tuitionNet,
      lump_sum_discount: lumpSumDiscount,
      comptant_amount: Math.round(tuitionOfficial * (1 - lumpSumDiscount)),
      comptant_deadline: installments[0].due_date,
      installments,
    },
  };
}
