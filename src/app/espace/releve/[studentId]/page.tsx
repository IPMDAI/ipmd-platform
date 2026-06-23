import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { matricule } from "@/lib/documents";
import {
  formatFCFA,
  computeFinance,
  deriveFinancialStatus,
  FINANCIAL_STATUS,
} from "@/lib/finance";

export const metadata: Metadata = { title: "Relevé de paiement" };

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function RelevePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requireUser();

  const [{ data: student }, { data: finance }, { data: paymentRows }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", studentId).single(),
      supabase
        .from("student_finance")
        .select("registration_fee, tuition_due, discount_rate, level, academic_year, status")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount, method, label, kind, reference, paid_at")
        .eq("student_id", studentId)
        .order("paid_at", { ascending: true }),
    ]);
  if (!student) notFound();

  const payments = paymentRows ?? [];
  const fin = computeFinance(finance, payments);
  const status = finance?.status || deriveFinancialStatus(fin);
  const statusInfo = FINANCIAL_STATUS[status] ?? { label: status, cls: "bg-black/5 text-black/60" };
  const name = student.full_name || student.email || "—";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link href="/espace/finance" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
              ← Finance
            </Link>
            <PrintButton />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src="/logo-ipmd.png" alt="IPMD" width={48} height={48} className="h-full w-full object-contain" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-ipmd-black">IPMD</p>
                  <p className="text-[11px] text-black/50">Institut Polytechnique des Métiers du Digital</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ipmd-black">Relevé de paiement</p>
                <p className="text-[11px] text-black/50">{finance?.academic_year ?? "2025-2026"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                Étudiant : <span className="font-bold text-ipmd-black">{name}</span>{" "}
                <span className="text-black/45">({matricule(studentId)})</span>
                {finance?.level ? ` · ${finance.level}` : ""}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Tableau des paiements */}
            <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-ipmd-light text-left text-xs uppercase tracking-wider text-black/45">
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Nature</th>
                    <th className="px-3 py-2 font-semibold">Mode</th>
                    <th className="px-3 py-2 font-semibold">Référence</th>
                    <th className="px-3 py-2 text-right font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-black/45">
                        Aucun paiement enregistré.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="border-t border-black/5">
                        <td className="px-3 py-2 text-black/70">{frDate(p.paid_at)}</td>
                        <td className="px-3 py-2 text-black/70">
                          {p.kind === "inscription" ? "Inscription" : "Scolarité"}
                          {p.label ? ` · ${p.label}` : ""}
                        </td>
                        <td className="px-3 py-2 text-black/70">{p.method || "—"}</td>
                        <td className="px-3 py-2 text-black/50">{p.reference || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-ipmd-black">
                          {formatFCFA(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Récap */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Total dû</p>
                <p className="text-base font-bold text-ipmd-black">{formatFCFA(fin.totalDue)}</p>
              </div>
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Total payé</p>
                <p className="text-base font-bold text-green-700">{formatFCFA(fin.totalPaid)}</p>
              </div>
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Reste à payer</p>
                <p className="text-base font-bold text-ipmd-red">
                  {fin.balance <= 0 ? "Soldé" : formatFCFA(fin.balance)}
                </p>
              </div>
            </div>

            <p className="mt-6 text-[11px] text-black/45">
              Document généré par l&apos;IPMD · scolarite@ipmd.pro · ipmd.pro
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
