import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeInstallmentAmounts } from "@/lib/finance";

/**
 * Source de données de la grille /scolarite (Lot Finance F6).
 *
 * Débranche la grille codée en dur : les montants sont calculés depuis la base
 * (`finance_settings` + `installment_plan` + `tuition_levels`), source unique
 * partagée avec l'échéancier candidat et la matérialisation.
 *
 * Lecture côté serveur via service-role (les montants sont publics ; aucune
 * donnée sensible). Renvoie `null` si indisponible (service-role absent en local,
 * ou données manquantes) → l'appelant retombe sur la grille statique de secours,
 * garantissant zéro page vide.
 */

export type FeeColumn = { label: string; pct: string };
export type FeeRow = { level: string; values: string[] };
export type ScolariteGrid = {
  feeColumns: FeeColumn[];
  feeRows: FeeRow[];
  enrollmentNotes: string[];
};

/** Groupe les milliers avec une espace : 1850000 → "1 850 000". */
const grp = (n: number): string =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Libellé de versement : 1 → "1er", n → "nᵉ". */
const ordinal = (n: number): string => (n === 1 ? "1er" : `${n}ᵉ`);

export async function loadScolariteGrid(): Promise<ScolariteGrid | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: settings } = await admin
    .from("finance_settings")
    .select("registration_fee, lump_sum_discount, academic_year")
    .eq("id", 1)
    .maybeSingle();
  const year = (settings?.academic_year as string) ?? null;
  if (!year) return null;

  const [{ data: plan }, { data: levels }] = await Promise.all([
    admin.from("installment_plan").select("seq, pct").eq("academic_year", year).order("seq"),
    admin.from("tuition_levels").select("level, amount, sort_order").gt("amount", 0).order("sort_order"),
  ]);
  if (!plan || plan.length === 0 || !levels || levels.length === 0) return null;

  const pcts = plan.map((r) => Number(r.pct));

  const feeColumns: FeeColumn[] = [
    { label: "Total", pct: "100 %" },
    ...pcts.map((p, i) => ({ label: ordinal(i + 1), pct: `${p} %` })),
  ];

  const feeRows: FeeRow[] = levels.map((l) => {
    const tuition = Number(l.amount);
    const amounts = computeInstallmentAmounts(tuition, pcts);
    return { level: l.level as string, values: [grp(tuition), ...amounts.map(grp)] };
  });

  const reg = Number(settings?.registration_fee ?? 300000);
  const disc = Number(settings?.lump_sum_discount ?? 0.15);
  const enrollmentNotes = [
    `Les frais d'inscription s'élèvent à ${grp(reg)} FCFA et ne sont pas inclus dans les frais de scolarité.`,
    `Possibilité de payer la scolarité en ${pcts.length} mois (échéancier ci-dessus).`,
    `Paiement unique : ${Math.round(disc * 100)} % de réduction.`,
  ];

  return { feeColumns, feeRows, enrollmentNotes };
}
