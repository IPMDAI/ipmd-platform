import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { matricule } from "@/lib/documents";
import { formatFCFA, computeFinance } from "@/lib/finance";

export const metadata: Metadata = { title: "Facture proforma" };

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ProformaPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requireUser();

  const [{ data: student }, { data: finance }, { data: schedules }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", studentId).single(),
      supabase
        .from("student_finance")
        .select("registration_fee, tuition_due, discount_rate, level, program, academic_year")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("payment_schedules")
        .select("label, amount, due_date")
        .eq("student_id", studentId)
        .order("due_date"),
    ]);
  if (!student) notFound();

  const fin = computeFinance(finance, []);
  const name = student.full_name || student.email || "—";
  const discount = Math.round((fin.tuitionDue - fin.tuitionNet));

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
                  <p className="text-[11px] text-black/50">
                    Institut Polytechnique des Métiers du Digital — Abidjan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ipmd-black">Facture proforma</p>
                <p className="text-[11px] text-black/50">{finance?.academic_year ?? "2025-2026"}</p>
              </div>
            </div>

            <p className="mt-4 text-sm">
              Étudiant : <span className="font-bold text-ipmd-black">{name}</span>{" "}
              <span className="text-black/45">({matricule(studentId)})</span>
            </p>
            <p className="text-sm text-black/60">
              {finance?.program ? `${finance.program} · ` : ""}
              {finance?.level ?? "Niveau non défini"}
            </p>

            {/* Détail des frais */}
            <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-black/5">
                    <td className="px-4 py-3 text-black/60">Frais d&apos;inscription</td>
                    <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                      {formatFCFA(fin.registrationFee)}
                    </td>
                  </tr>
                  <tr className="border-b border-black/5">
                    <td className="px-4 py-3 text-black/60">Frais de scolarité</td>
                    <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                      {formatFCFA(fin.tuitionDue)}
                    </td>
                  </tr>
                  {discount > 0 && (
                    <tr className="border-b border-black/5 text-green-700">
                      <td className="px-4 py-3">
                        Réduction paiement unique (−{Math.round(fin.discountRate * 100)}%)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        −{formatFCFA(discount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-ipmd-black px-5 py-4 text-white">
              <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Total à payer
              </span>
              <span className="text-2xl font-extrabold">{formatFCFA(fin.totalDue)}</span>
            </div>

            {/* Échéancier */}
            {(schedules ?? []).length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-black/40">
                  Échéancier de paiement
                </h2>
                <ul className="divide-y divide-black/5 overflow-hidden rounded-xl ring-1 ring-black/10">
                  {(schedules ?? []).map((s, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="text-black/70">
                        {s.label || `Échéance ${i + 1}`} · {frDate(s.due_date)}
                      </span>
                      <span className="font-semibold text-ipmd-black">{formatFCFA(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 text-[11px] leading-relaxed text-black/50">
              <p className="font-semibold text-black/60">Conditions de paiement</p>
              <p>
                Les frais d&apos;inscription ({formatFCFA(fin.registrationFee)}) sont à régler en
                premier et donnent accès à la plateforme, à la carte étudiant et à
                l&apos;attestation d&apos;inscription. Le certificat d&apos;inscription est délivré
                après solde complet de la scolarité. Paiements acceptés : Wave, versement /
                virement BACI ou AFG, chèque. Document non contractuel — proforma.
              </p>
              <p className="mt-2">scolarite@ipmd.pro · ipmd.pro</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
