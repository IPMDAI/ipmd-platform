import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";
import {
  FinanceSettingsForm,
  TuitionLevelForm,
} from "@/components/espace/FinanceConfigForms";

export const metadata: Metadata = {
  title: "Paramètres financiers",
};

const STAFF = ["admin", "super_admin", "scolarite"];

export default async function FinanceParamsPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [{ data: settings }, { data: levels }] = await Promise.all([
    supabase.from("finance_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("tuition_levels").select("*").order("sort_order"),
  ]);

  const discountPct = Math.round(Number(settings?.lump_sum_discount ?? 0.15) * 1000) / 10;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace/finance"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Finance
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Paramètres financiers
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Frais d&apos;inscription, réduction paiement unique et frais de
            scolarité par niveau.
          </p>

          {/* Paramètres globaux */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-lg font-bold text-ipmd-black">
              Frais d&apos;inscription & réduction
            </h2>
            <FinanceSettingsForm
              registrationFee={Number(settings?.registration_fee ?? 300000)}
              discountPct={discountPct}
              academicYear={settings?.academic_year ?? "2025-2026"}
            />
            <p className="mt-3 text-xs text-black/45">
              💡 Les frais d&apos;inscription ({formatFCFA(settings?.registration_fee ?? 300000)})
              sont gérés séparément de la scolarité. La réduction de {discountPct}% s&apos;applique
              uniquement à la scolarité réglée en une fois.
            </p>
          </div>

          {/* Scolarité par niveau */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-lg font-bold text-ipmd-black">
              Frais de scolarité par niveau
            </h2>
            <div className="space-y-2">
              {(levels ?? []).map((l) => (
                <TuitionLevelForm key={l.level} level={l.level} amount={Number(l.amount)} />
              ))}
            </div>
            <div className="mt-4 border-t border-black/5 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/40">
                Ajouter un niveau / programme
              </p>
              <TuitionLevelForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
