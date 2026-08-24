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
  discount_rate: number; // remise du plan EFFECTIVE appliquée (0 si non appliquée)
  tuition_net: number; // = round((officiel − scholarship_amount) × (1 − discount_rate)) ; 0 = bourse totale
  lump_sum_discount: number; // remise comptant DISPONIBLE (plan 1), pour affichage
  comptant_amount: number; // scolarité si comptant (plan 1), info d'affichage
  comptant_deadline: string; // = due_date de T1 (jour 30 standard)
  // Bourse IPMD figée (jamais recalculée par PDF/pack/finalisation) :
  plan_discount_rate: number; // remise du plan CONFIG (payment_plans)
  plan_discount_applied: boolean; // remise plan réellement appliquée ?
  scholarship_id: string | null;
  scholarship_term_id: string | null;
  scholarship_amount: number; // bourse RÉELLEMENT appliquée (0 si aucune)
  scholarship_mode: ScholarshipMode | null;
  scholarship_rate: number | null; // si mode=taux
  installments: ScheduleInstallment[]; // longueur === plan_months ; [] si bourse totale (net 0)
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

// ============ BOURSE IPMD (moteur pur, modèle B1) ============
export type ScholarshipMode = "taux" | "montant";
export type ScholarshipEngagement = {
  id: string;
  status: "active" | "revoked";
  start_academic_year: string; // "2026-2027"
  duration_years: 1 | 2 | 3;
  plan_discount_cumulable: boolean;
};
export type ScholarshipTerm = {
  id: string;
  academic_year: string;
  mode: ScholarshipMode;
  rate?: number | null; // si taux
  amount?: number | null; // si montant
  status: "active" | "superseded" | "suspended";
};

function startYearOf(label: string): number {
  return parseInt(label.split("-")[0], 10);
}

/**
 * Résout la bourse APPLICABLE pour une année : engagement révoqué → aucune ;
 * année hors couverture [start … start+durée−1] → aucune ; terme `suspended` →
 * aucune (année couverte non appliquée) ; sinon le terme `active` de l'année.
 */
export function resolveScholarshipForYear(
  eng: ScholarshipEngagement | null | undefined,
  terms: ScholarshipTerm[],
  academicYear: string
): ScholarshipTerm | null {
  if (!eng || eng.status === "revoked") return null;
  const offset = startYearOf(academicYear) - startYearOf(eng.start_academic_year);
  if (!Number.isFinite(offset) || offset < 0 || offset >= eng.duration_years) return null;
  const current = terms.find(
    (t) => t.academic_year === academicYear && (t.status === "active" || t.status === "suspended")
  );
  if (!current || current.status === "suspended") return null;
  return current;
}

/** Montant de bourse BORNÉ à [0, tarif officiel] (taux → round(officiel×taux)). */
export function scholarshipAmount(term: ScholarshipTerm | null, official: number): number {
  if (!term) return 0;
  const raw = term.mode === "taux" ? Math.round(official * (term.rate ?? 0)) : term.amount ?? 0;
  return Math.max(0, Math.min(raw, official));
}

/**
 * Applique bourse + remise de plan et renvoie ce qui est RÉELLEMENT appliqué.
 *  - cumulable : bourse puis remise plan sur le reste ;
 *  - non-cumulable : MEILLEUR AVANTAGE (net le plus bas) entre bourse seule et plan seul.
 */
export function applyBourseAndPlan(
  official: number,
  sch: number,
  planDiscount: number,
  cumulable: boolean
): { schApplied: number; effDiscount: number; planApplied: boolean } {
  if (sch <= 0) return { schApplied: 0, effDiscount: planDiscount, planApplied: planDiscount > 0 };
  if (cumulable) return { schApplied: sch, effDiscount: planDiscount, planApplied: planDiscount > 0 };
  const netBourse = official - sch;
  const netPlan = Math.round(official * (1 - planDiscount));
  if (netBourse <= netPlan) return { schApplied: sch, effDiscount: 0, planApplied: false };
  return { schApplied: 0, effDiscount: planDiscount, planApplied: planDiscount > 0 };
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
  if (net == null || net < 0) return { ok: false, reason: "invalide (scolarité à financer absente)" };
  if (reg == null || reg < 0) return { ok: false, reason: "invalide (frais d'inscription absents)" };
  if (disc == null || disc < 0 || disc >= 1) return { ok: false, reason: "invalide (remise incohérente)" };

  const pm = resolvePlanMonths(s);
  if (pm == null) return { ok: false, reason: "invalide (plan inconnu)" };

  // BOURSE TOTALE : net = 0 → aucune tranche de scolarité (échéancier vide autorisé UNIQUEMENT ici).
  if (net === 0) {
    if (!Array.isArray(inst) || inst.length !== 0) {
      return { ok: false, reason: "invalide (bourse totale : échéancier doit être vide)" };
    }
    return { ok: true, snap: json as ScheduleSnapshot };
  }

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
  discountRate: number; // remise du plan CONFIG (payment_plans)
  lumpSumDiscount: number;
  planRows: PlanRow[];
  scholarshipEngagement?: ScholarshipEngagement | null; // bourse (résolue pour l'année en interne)
  scholarshipTerms?: ScholarshipTerm[];
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

  // BOURSE IPMD : résout le terme applicable pour l'année, puis applique la règle
  // (cumul / meilleur avantage). Sans bourse → schApplied=0, effDiscount=remise plan.
  const term = resolveScholarshipForYear(input.scholarshipEngagement, input.scholarshipTerms ?? [], academicYear ?? "");
  const sch = scholarshipAmount(term, tuitionOfficial);
  const cumulable = input.scholarshipEngagement?.plan_discount_cumulable ?? false;
  const { schApplied, effDiscount, planApplied } = applyBourseAndPlan(tuitionOfficial, sch, discountRate, cumulable);

  // FORMULE UNIFIÉE : net = (officiel − bourse appliquée) × (1 − remise plan effective).
  const tuitionNet = Math.round((tuitionOfficial - schApplied) * (1 - effDiscount));
  const comptantAmount = Math.round(tuitionOfficial * (1 - lumpSumDiscount)); // affichage (plan 1)
  const t1 = applyStandardDay(rows[0].due_date);

  // Bourse totale (net 0) → aucune tranche de scolarité ; sinon répartition (dernière ajustée).
  let cumul = 0;
  const installments: ScheduleInstallment[] =
    tuitionNet === 0
      ? []
      : rows.map((r, i) => {
          const amount = i < rows.length - 1 ? Math.round((tuitionNet * Number(r.pct)) / 100) : tuitionNet - cumul;
          if (i < rows.length - 1) cumul += amount;
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
      discount_rate: effDiscount,
      tuition_net: tuitionNet,
      lump_sum_discount: lumpSumDiscount,
      comptant_amount: comptantAmount,
      comptant_deadline: t1,
      plan_discount_rate: discountRate,
      plan_discount_applied: planApplied,
      scholarship_id: term ? input.scholarshipEngagement!.id : null,
      scholarship_term_id: term ? term.id : null,
      scholarship_amount: schApplied,
      scholarship_mode: term ? term.mode : null,
      scholarship_rate: term && term.mode === "taux" ? term.rate ?? null : null,
      installments,
    },
  };
}
