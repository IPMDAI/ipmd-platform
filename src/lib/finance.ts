/** Moyens de paiement proposés. */
export const PAYMENT_METHODS = [
  "Espèces",
  "Virement",
  "Mobile Money",
  "Chèque",
  "Carte",
];

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
