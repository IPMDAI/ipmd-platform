import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Ma scolarité",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MesPaiementsPage() {
  const { supabase, userId } = await requireUser();

  const [{ data: finance }, { data: paymentRows }] = await Promise.all([
    supabase
      .from("student_finance")
      .select("total_due")
      .eq("student_id", userId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, method, label, paid_at")
      .eq("student_id", userId)
      .order("paid_at", { ascending: false }),
  ]);

  const totalDue = Number(finance?.total_due ?? 0);
  const payments = paymentRows ?? [];
  const totalPaid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const balance = totalDue - totalPaid;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Ma scolarité
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Le détail de tes frais et de tes paiements. Grille des frais sur{" "}
            <Link href="/scolarite" className="font-semibold text-ipmd-red">
              la page Scolarité
            </Link>
            .
          </p>

          {/* Résumé */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Dû</p>
              <p className="mt-1 text-lg font-extrabold text-ipmd-black">
                {formatFCFA(totalDue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">
                Payé
              </p>
              <p className="mt-1 text-lg font-extrabold text-green-600">
                {formatFCFA(totalPaid)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">
                Solde
              </p>
              <p
                className={`mt-1 text-lg font-extrabold ${
                  balance <= 0 ? "text-green-600" : "text-ipmd-red"
                }`}
              >
                {balance <= 0 ? "À jour" : formatFCFA(balance)}
              </p>
            </div>
          </div>

          {/* Historique */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">
            Mes paiements
          </h2>
          {payments.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun paiement enregistré pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ipmd-black">
                      {formatFCFA(p.amount)}
                    </p>
                    <p className="truncate text-xs text-black/50">
                      {formatDate(p.paid_at)}
                      {p.method && ` · ${p.method}`}
                      {p.label && ` · ${p.label}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-green-600">✓</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
