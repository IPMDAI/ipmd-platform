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

export type PaymentOption = "echelonne" | "comptant";

/** Jour d'échéance mensuel choisi par le candidat (D1). Défaut "20". */
export type PaymentDay = "20" | "fin_mois";

export type ScheduleSnapshot = {
  academic_year: string;
  level: string;
  registration_fee: number;
  tuition_official: number; // tarif officiel — jamais écrasé
  payment_option: PaymentOption; // choix candidat (F3) ; défaut echelonne
  payment_day: PaymentDay; // choix candidat (D1) : 20 du mois ou fin de mois ; défaut "20"
  discount_rate: number; // 0 en échelonné ; lump_sum_discount en comptant
  tuition_net: number; // officielle en échelonné ; officielle×(1−remise) en comptant
  lump_sum_discount: number; // remise comptant DISPONIBLE (pour affichage)
  comptant_amount: number; // scolarité si comptant (info, toujours calculée)
  comptant_deadline: string; // = due_date de T1 (selon payment_day)
  installments: ScheduleInstallment[]; // 10 tranches (échelonné) ; 1 règlement (comptant)
};

/** Nb de jours du mois (1-12), gère les années bissextiles (février 28/29). */
export function daysInMonth(year: number, month1to12: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month1to12 - 1];
}

/**
 * Applique le JOUR d'échéance choisi à une date `installment_plan` (YYYY-MM-DD),
 * en conservant ANNÉE + MOIS (source unique = installment_plan). Ne recalcule
 * QUE le jour. Aucun impact sur pct/montants.
 *  - "20"       → le 20 du mois ;
 *  - "fin_mois" → dernier jour calendaire réel (févr. 28/29, 30 ou 31).
 */
export function applyPaymentDay(dueDate: string, paymentDay: PaymentDay): string {
  const [y, m] = dueDate.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return dueDate;
  const day = paymentDay === "fin_mois" ? daysInMonth(y, m) : 20;
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type ScheduleResult =
  | { ok: true; schedule: ScheduleSnapshot }
  | { ok: false; code: "PLAN_MANQUANT" | "PLAN_INVALIDE" | "TARIF_MANQUANT"; message: string };

/**
 * Valide un `admission_packs.schedule_json` déjà figé, AVANT matérialisation
 * (Lot Finance F4). Module PUR : ne touche pas la DB. Vérifie la complétude ET
 * la cohérence réelle (somme des tranches = scolarité à financer nette). Sert de
 * garde-fou : sans snapshot valide, on ne matérialise pas et on ne passe pas
 * « inscrit ».
 */
export function validateScheduleSnapshot(
  json: unknown
): { ok: true; snap: ScheduleSnapshot } | { ok: false; reason: string } {
  if (json == null || typeof json !== "object") return { ok: false, reason: "manquant" };
  const s = json as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const official = num(s.tuition_official);
  const net = num(s.tuition_net);
  const reg = num(s.registration_fee);
  const disc = num(s.discount_rate);
  const opt = s.payment_option;
  const inst = s.installments;

  if (official == null || !(official > 0)) return { ok: false, reason: "invalide (tarif officiel absent)" };
  if (net == null || !(net > 0)) return { ok: false, reason: "invalide (scolarité à financer absente)" };
  if (reg == null || reg < 0) return { ok: false, reason: "invalide (frais d'inscription absents)" };
  if (disc == null || disc < 0 || disc >= 1) return { ok: false, reason: "invalide (remise incohérente)" };
  if (opt !== "echelonne" && opt !== "comptant") return { ok: false, reason: "invalide (mode de paiement inconnu)" };
  if (!Array.isArray(inst) || inst.length === 0) return { ok: false, reason: "invalide (aucune tranche)" };
  if (opt === "comptant" && inst.length !== 1) return { ok: false, reason: "invalide (comptant ≠ 1 règlement)" };
  if (opt === "echelonne" && inst.length !== 10) return { ok: false, reason: "invalide (échelonné ≠ 10 tranches)" };

  let sum = 0;
  for (const raw of inst) {
    if (raw == null || typeof raw !== "object") return { ok: false, reason: "invalide (tranche illisible)" };
    const r = raw as Record<string, unknown>;
    const amt = num(r.amount);
    const seq = num(r.seq);
    if (amt == null || !(amt > 0)) return { ok: false, reason: "invalide (montant de tranche incorrect)" };
    if (seq == null) return { ok: false, reason: "invalide (numéro de tranche manquant)" };
    if (typeof r.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.due_date)) {
      return { ok: false, reason: "invalide (date de tranche incorrecte)" };
    }
    sum += amt;
  }
  if (sum !== net) {
    return { ok: false, reason: `invalide (somme des tranches ${sum} ≠ scolarité à financer ${net})` };
  }
  return { ok: true, snap: json as ScheduleSnapshot };
}

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
  paymentOption?: PaymentOption; // F3 : choix candidat ; défaut echelonne
  paymentDay?: PaymentDay; // D1 : jour d'échéance ; défaut "20"
}): ScheduleResult {
  const { academicYear, level, registrationFee, tuitionOfficial, lumpSumDiscount } = input;
  const paymentOption: PaymentOption = input.paymentOption === "comptant" ? "comptant" : "echelonne";
  const paymentDay: PaymentDay = input.paymentDay === "fin_mois" ? "fin_mois" : "20";

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
  // D1 : le jour d'échéance suit le choix candidat ; année+mois viennent du plan.
  const t1 = applyPaymentDay(rows[0].due_date, paymentDay); // 1re échéance = deadline comptant
  const comptantAmount = Math.round(tuitionOfficial * (1 - lumpSumDiscount)); // scolarité seule

  let discountRate: number;
  let tuitionNet: number;
  let installments: ScheduleInstallment[];

  if (paymentOption === "comptant") {
    // Comptant : remise sur la scolarité uniquement ; 1 seul règlement à échéance T1.
    discountRate = lumpSumDiscount;
    tuitionNet = comptantAmount;
    installments = [{ seq: 1, pct: 100, due_date: t1, amount: tuitionNet }];
  } else {
    // Échelonné : tarif officiel, 10 tranches ; dernière ajustée → somme exacte.
    discountRate = 0;
    tuitionNet = tuitionOfficial;
    let cumul = 0;
    installments = rows.map((r, i) => {
      let amount: number;
      if (i < rows.length - 1) {
        amount = Math.round((tuitionNet * Number(r.pct)) / 100);
        cumul += amount;
      } else {
        amount = tuitionNet - cumul;
      }
      return { seq: r.seq, pct: Number(r.pct), due_date: applyPaymentDay(r.due_date, paymentDay), amount };
    });
  }

  return {
    ok: true,
    schedule: {
      academic_year: academicYear ?? "",
      level: level ?? "",
      registration_fee: registrationFee,
      tuition_official: tuitionOfficial,
      payment_option: paymentOption,
      payment_day: paymentDay,
      discount_rate: discountRate,
      tuition_net: tuitionNet,
      lump_sum_discount: lumpSumDiscount,
      comptant_amount: comptantAmount,
      comptant_deadline: t1,
      installments,
    },
  };
}
