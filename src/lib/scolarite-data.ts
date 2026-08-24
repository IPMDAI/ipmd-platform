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
 * donnée sensible). SOURCE UNIQUE : aucune valeur financière codée en dur.
 * Renvoie `null` (avec log serveur) si indisponible/incomplet — l'appelant affiche
 * alors un état « temporairement indisponible », JAMAIS une ancienne grille figée.
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
  if (!admin) {
    console.error("[scolarite] service-role indisponible — grille financière non chargée.");
    return null;
  }

  try {
    const { data: settings, error: sErr } = await admin
      .from("finance_settings")
      .select("registration_fee, lump_sum_discount, academic_year")
      .eq("id", 1)
      .maybeSingle();
    const year = (settings?.academic_year as string) ?? null;
    if (sErr || !settings || !year) {
      console.error(
        `[scolarite] finance_settings illisible/incomplet — grille non chargée${sErr ? ` (${sErr.message})` : ""}.`
      );
      return null;
    }

    const [{ data: plan, error: pErr }, { data: levels, error: lErr }] = await Promise.all([
      admin.from("installment_plan").select("seq, pct").eq("academic_year", year).eq("plan_months", 10).order("seq"),
      admin.from("tuition_levels").select("level, amount, sort_order").gt("amount", 0).order("sort_order"),
    ]);
    if (pErr || lErr || !plan || plan.length === 0 || !levels || levels.length === 0) {
      console.error(
        `[scolarite] installment_plan(${year})/tuition_levels illisible ou vide — grille non chargée${pErr ? ` (plan: ${pErr.message})` : ""}${lErr ? ` (levels: ${lErr.message})` : ""}.`
      );
      return null;
    }

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

    const reg = Number(settings.registration_fee);
    const disc = Number(settings.lump_sum_discount);
    if (!(reg > 0) || !(disc >= 0 && disc < 1)) {
      console.error(
        `[scolarite] finance_settings incohérent (registration_fee=${reg}, lump_sum_discount=${disc}) — grille non chargée.`
      );
      return null;
    }
    const enrollmentNotes = [
      `Les frais d'inscription s'élèvent à ${grp(reg)} FCFA et ne sont pas inclus dans les frais de scolarité.`,
      `Possibilité de payer la scolarité en ${pcts.length} mois (échéancier ci-dessus).`,
      `Paiement unique : ${Math.round(disc * 100)} % de réduction.`,
    ];

    return { feeColumns, feeRows, enrollmentNotes };
  } catch (e) {
    console.error(
      `[scolarite] erreur de chargement de la grille financière : ${e instanceof Error ? e.message : "erreur inconnue"}`
    );
    return null;
  }
}
