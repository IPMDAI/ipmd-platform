/** Moyens de paiement acceptés à l'IPMD. */
export const PAYMENT_METHODS = [
  "Wave",
  "Versement BACI",
  "Versement AFG",
  "Virement bancaire",
  "Chèque",
  "Espèces",
];

/** Niveaux par défaut (modifiables via Paramètres financiers). */
export const DEFAULT_LEVELS = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Bootcamp",
  "Executive",
];

/** Nature d'un paiement. */
export const PAYMENT_KINDS = [
  { value: "inscription", label: "Frais d'inscription" },
  { value: "scolarite", label: "Frais de scolarité" },
];

/** États d'accès à la plateforme selon la scolarité. */
export const ACCESS_STATES: Record<string, { label: string; cls: string }> = {
  actif: { label: "Accès actif", cls: "bg-green-50 text-green-700" },
  pause: { label: "Accès en pause", cls: "bg-amber-50 text-amber-700" },
  bloque: { label: "Accès bloqué", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

/** Statuts financiers (libellé + couleur). */
export const FINANCIAL_STATUS: Record<string, { label: string; cls: string }> = {
  inscription_non_soldee: { label: "Inscription non soldée", cls: "bg-ipmd-red/10 text-ipmd-red" },
  inscription_soldee: { label: "Inscription soldée", cls: "bg-blue-50 text-blue-700" },
  a_jour: { label: "Scolarité à jour", cls: "bg-green-50 text-green-700" },
  partielle: { label: "Scolarité partielle", cls: "bg-amber-50 text-amber-700" },
  non_a_jour: { label: "Non à jour", cls: "bg-ipmd-red/10 text-ipmd-red" },
  solde: { label: "Soldé", cls: "bg-green-600 text-white" },
  negociation: { label: "En négociation", cls: "bg-purple-50 text-purple-700" },
  avertissement: { label: "En avertissement", cls: "bg-orange-50 text-orange-700" },
};

export type FinanceState = {
  registrationFee: number;
  tuitionDue: number;
  discountRate: number;
  tuitionNet: number; // scolarité après réduction
  totalDue: number; // inscription + scolarité nette
  paidInscription: number;
  paidScolarite: number;
  totalPaid: number;
  balance: number;
  registrationSettled: boolean;
  tuitionSettled: boolean;
};

/** Calcule la situation financière à partir des frais et des paiements (tagués par nature). */
export function computeFinance(
  finance: {
    registration_fee?: number | null;
    tuition_due?: number | null;
    discount_rate?: number | null;
  } | null,
  payments: { amount: number | string; kind?: string | null }[]
): FinanceState {
  const registrationFee = Number(finance?.registration_fee ?? 0);
  const tuitionDue = Number(finance?.tuition_due ?? 0);
  const discountRate = Number(finance?.discount_rate ?? 0);
  const tuitionNet = Math.round(tuitionDue * (1 - discountRate));
  const totalDue = registrationFee + tuitionNet;

  let paidInscription = 0;
  let paidScolarite = 0;
  for (const p of payments) {
    const amt = Number(p.amount);
    if (p.kind === "inscription") paidInscription += amt;
    else paidScolarite += amt;
  }
  const totalPaid = paidInscription + paidScolarite;

  return {
    registrationFee,
    tuitionDue,
    discountRate,
    tuitionNet,
    totalDue,
    paidInscription,
    paidScolarite,
    totalPaid,
    balance: totalDue - totalPaid,
    registrationSettled: registrationFee > 0 ? paidInscription >= registrationFee : true,
    tuitionSettled: tuitionNet > 0 ? paidScolarite >= tuitionNet : false,
  };
}

/** Déduit le statut financier automatique (peut être surchargé manuellement). */
export function deriveFinancialStatus(s: FinanceState): string {
  if (!s.registrationSettled) return "inscription_non_soldee";
  if (s.balance <= 0 && s.totalDue > 0) return "solde";
  if (s.tuitionSettled) return "solde";
  if (s.paidScolarite > 0) return "partielle";
  return "inscription_soldee";
}

/** Formate un montant en FCFA (XOF). */
export function formatFCFA(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

export type Installment = {
  id: string;
  label: string | null;
  amount: number;
  due_date: string;
};

export type SchedRow = Installment & { status: "payee" | "a_venir" | "retard" };

export const SCHED_STATUS: Record<SchedRow["status"], { label: string; cls: string }> = {
  payee: { label: "Payée", cls: "bg-green-50 text-green-700" },
  a_venir: { label: "À venir", cls: "bg-black/5 text-black/55" },
  retard: { label: "En retard", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

/**
 * Calcule le statut de chaque échéance à partir du total déjà payé
 * (imputation cumulative dans l'ordre des dates) et renvoie la prochaine.
 */
export function computeSchedule(
  items: Installment[],
  totalPaid: number,
  today: string
): { rows: SchedRow[]; next: SchedRow | null } {
  const sorted = [...items].sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
  let cumulative = 0;
  const rows: SchedRow[] = sorted.map((it) => {
    cumulative += Number(it.amount);
    let status: SchedRow["status"];
    if (totalPaid >= cumulative) status = "payee";
    else if (it.due_date < today) status = "retard";
    else status = "a_venir";
    return { ...it, status };
  });
  const next = rows.find((r) => r.status !== "payee") ?? null;
  return { rows, next };
}
