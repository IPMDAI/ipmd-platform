/**
 * Snapshot financier d'admission — module PUR (aucun accès DB).
 *
 * Fige, à « Confirmer l'admission », l'échéancier depuis les sources LIVE :
 *  - scolarité officielle = tuition_levels/classes (jamais codée en dur) ;
 *  - plan choisi ∈ {1,2,3,6,8,10} (payment_plans) → tranches depuis installment_plan
 *    filtré sur ce plan (pct + due_date) ;
 *  - remise du plan (payment_plans.discount_rate : 15/10/5/0/0/0) appliquée à la
 *    SCOLARITÉ seule ; inscription jamais remisée ;
 *  - montants = tuition_net × pct, dernière tranche ajustée pour somme exacte ;
 *  - jour d'échéance standard = 30 (février = dernier jour réel) ;
 *  - deadline = date de la 1re tranche (T1).
 *
 * `payment_option` est CONSERVÉ comme champ dérivé de compatibilité (plan 1 →
 * comptant ; 2/3/6/8/10 → echelonne). La lecture DB (payment_plans, installment_plan,
 * finance_settings) est faite par l'appelant serveur et injectée ici.
 */

export const PLAN_MONTHS = [1, 2, 3, 6, 8, 10] as const;
export type PlanMonths = (typeof PLAN_MONTHS)[number];

export type PlanRow = { seq: number; pct: number; due_date: string };
export type ScheduleInstallment = { seq: number; pct: number; due_date: string; amount: number };
export type PaymentOption = "echelonne" | "comptant";

export function isPlanMonths(n: unknown): n is PlanMonths {
  return typeof n === "number" && (PLAN_MONTHS as readonly number[]).includes(n);
}

export type ScheduleSnapshot = {
  academic_year: string;
  level: string;
  registration_fee: number;
  tuition_official: number; // tarif officiel — jamais écrasé
  plan_months: PlanMonths; // SOURCE PRIMAIRE : nb de mensualités du plan choisi
  payment_option: PaymentOption; // dérivé de compat (plan 1 → comptant ; sinon echelonne)
  discount_rate: number; // remise du plan appliquée (0 si sans remise)
  tuition_net: number; // officielle × (1 − discount_rate)
  lump_sum_discount: number; // remise comptant DISPONIBLE (plan 1), pour affichage
  comptant_amount: number; // scolarité si comptant (plan 1), info d'affichage
  comptant_deadline: string; // = due_date de T1 (jour 30 standard)
  installments: ScheduleInstallment[]; // longueur === plan_months
};

/** Nb de jours du mois (1-12), gère les années bissextiles (février 28/29). */
export function daysInMonth(year: number, month1to12: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month1to12 - 1];
}

/**
 * Applique le JOUR d'échéance STANDARD à une date `installment_plan` (YYYY-MM-DD),
 * en conservant ANNÉE + MOIS. Ne recalcule QUE le jour. Règle unique :
 *  - jour 30 pour tous les mois ;
 *  - février → dernier jour réel (28 ou 29 selon l'année bissextile).
 * Vaut pour tous les plans (1/2/3/6/8/10) car appliquée par échéance.
 */
export function applyStandardDay(dueDate: string): string {
  const [y, m] = dueDate.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return dueDate;
  const day = m === 2 ? daysInMonth(y, m) : 30;
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Le gabarit d'un plan = exactement `planMonths` tranches sommant à 100 %. */
export function validatePlan(rows: PlanRow[], planMonths: PlanMonths): boolean {
  if (rows.length !== planMonths) return false;
  return Math.round(rows.reduce((a, r) => a + Number(r.pct), 0)) === 100;
}

/**
 * Backward-compat : dérive plan_months d'un snapshot (nouveau OU ancien).
 * Nouveau → `plan_months`. Ancien → payment_option comptant→1 / echelonne→10.
 */
export function resolvePlanMonths(s: Record<string, unknown>): PlanMonths | null {
  if (isPlanMonths(s.plan_months)) return s.plan_months;
  if (s.payment_option === "comptant") return 1;
  if (s.payment_option === "echelonne") return 10;
  return null;
}

export type ScheduleResult =
  | { ok: true; schedule: ScheduleSnapshot }
  | { ok: false; code: "PLAN_MANQUANT" | "PLAN_INVALIDE" | "TARIF_MANQUANT" | "PLAN_NON_SUPPORTE"; message: string };

/**
 * Valide un `admission_packs.schedule_json` déjà figé, AVANT matérialisation.
 * Module PUR. Accepte les snapshots NOUVEAUX (plan_months) ET ANCIENS
 * (payment_option echelonne=10 / comptant=1). Vérifie longueur === plan_months et
 * somme des tranches = scolarité à financer nette. Garde-fou : sans snapshot valide,
 * on ne matérialise pas et on ne passe pas « inscrit ».
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
  const inst = s.installments;

  if (official == null || !(official > 0)) return { ok: false, reason: "invalide (tarif officiel absent)" };
  if (net == null || !(net > 0)) return { ok: false, reason: "invalide (scolarité à financer absente)" };
  if (reg == null || reg < 0) return { ok: false, reason: "invalide (frais d'inscription absents)" };
  if (disc == null || disc < 0 || disc >= 1) return { ok: false, reason: "invalide (remise incohérente)" };

  const pm = resolvePlanMonths(s);
  if (pm == null) return { ok: false, reason: "invalide (plan inconnu)" };
  if (!Array.isArray(inst) || inst.length !== pm) {
    return { ok: false, reason: `invalide (${Array.isArray(inst) ? inst.length : 0} tranches ≠ plan ${pm})` };
  }

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

/**
 * Construit le snapshot pour un plan donné. `planRows` = tranches du plan
 * (installment_plan where plan_months=planMonths) ; `discountRate` = remise du plan
 * (payment_plans) ; `lumpSumDiscount` = remise comptant disponible (finance_settings,
 * pour l'affichage). Inscription séparée, jamais remisée. Bloque proprement si invalide.
 */
export function buildScheduleSnapshot(input: {
  academicYear: string | null;
  level: string | null;
  registrationFee: number;
  tuitionOfficial: number | null;
  planMonths: number;
  discountRate: number;
  lumpSumDiscount: number;
  planRows: PlanRow[];
}): ScheduleResult {
  const { academicYear, level, registrationFee, tuitionOfficial, discountRate, lumpSumDiscount } = input;

  if (!isPlanMonths(input.planMonths)) {
    return {
      ok: false,
      code: "PLAN_NON_SUPPORTE",
      message: `Plan de paiement ${input.planMonths} non supporté (1, 2, 3, 6, 8 ou 10 mensualités).`,
    };
  }
  const planMonths = input.planMonths;

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
      message: `Aucun échéancier configuré pour l'année ${academicYear ?? "active"} (plan ${planMonths} mensualités).`,
    };
  }
  if (discountRate < 0 || discountRate >= 1) {
    return { ok: false, code: "PLAN_INVALIDE", message: "Remise du plan incohérente." };
  }
  if (!validatePlan(input.planRows, planMonths)) {
    return {
      ok: false,
      code: "PLAN_INVALIDE",
      message: `Plan ${planMonths} mensualités invalide : il faut exactement ${planMonths} tranches dont la somme des pourcentages = 100 %.`,
    };
  }

  const rows = [...input.planRows].sort((a, b) => a.seq - b.seq);
  // Remise du plan sur la scolarité seule ; inscription intacte.
  const tuitionNet = Math.round(tuitionOfficial * (1 - discountRate));
  // Montant du scénario COMPTANT (plan 1), pour l'affichage (bouton/PDF).
  const comptantAmount = Math.round(tuitionOfficial * (1 - lumpSumDiscount));
  // Jour standard (30 / février dernier jour) ; année+mois viennent du plan.
  const t1 = applyStandardDay(rows[0].due_date);

  // Répartition : arrondi par tranche, dernière ajustée → somme exacte = net.
  let cumul = 0;
  const installments: ScheduleInstallment[] = rows.map((r, i) => {
    let amount: number;
    if (i < rows.length - 1) {
      amount = Math.round((tuitionNet * Number(r.pct)) / 100);
      cumul += amount;
    } else {
      amount = tuitionNet - cumul;
    }
    return { seq: r.seq, pct: Number(r.pct), due_date: applyStandardDay(r.due_date), amount };
  });

  const paymentOption: PaymentOption = planMonths === 1 ? "comptant" : "echelonne";

  return {
    ok: true,
    schedule: {
      academic_year: academicYear ?? "",
      level: level ?? "",
      registration_fee: registrationFee,
      tuition_official: tuitionOfficial,
      plan_months: planMonths,
      payment_option: paymentOption,
      discount_rate: discountRate,
      tuition_net: tuitionNet,
      lump_sum_discount: lumpSumDiscount,
      comptant_amount: comptantAmount,
      comptant_deadline: t1,
      installments,
    },
  };
}
