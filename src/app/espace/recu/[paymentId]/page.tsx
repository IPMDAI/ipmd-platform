import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { PaymentReceipt } from "@/components/espace/documents/PaymentReceipt";
import { matricule, academicYear } from "@/lib/documents";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { computeFinance } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Reçu de paiement",
};

export default async function RecuPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const { supabase, userId } = await requireUser();

  // RLS : le paiement n'est lisible que par l'étudiant, son parent ou un admin.
  const { data: payment } = await supabase
    .from("payments")
    .select("id, student_id, candidature_id, amount, method, label, paid_at, kind, reference")
    .eq("id", paymentId)
    .single();
  if (!payment) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isStaff = ["admin", "super_admin", "scolarite"].includes(me?.role ?? "");

  // W4 : paiement PRÉ-INSCRIPTION (student_id NULL, rattaché à une candidature).
  // Reçu admin-only ; nom depuis la candidature ; pas de matricule/récap (aucun
  // profil ni student_finance avant l'inscription). Ne jamais appeler
  // matricule(null) ni interroger student_finance avec un student_id NULL.
  const isPre = !payment.student_id;
  if (isPre && !isStaff) notFound();

  let name = "—";
  let mat = "—";
  let formation: string | null = null;
  let recap: { totalDue: number; totalPaid: number; balance: number } | undefined;

  if (payment.student_id) {
    const [{ data: student }, { data: finance }, { data: allPayments }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", payment.student_id).maybeSingle(),
      supabase
        .from("student_finance")
        .select("registration_fee, tuition_due, discount_rate, level, program")
        .eq("student_id", payment.student_id)
        .maybeSingle(),
      supabase.from("payments").select("amount, kind, status").eq("student_id", payment.student_id),
    ]);
    name = student?.full_name || student?.email || "—";
    mat = matricule(payment.student_id);
    formation = finance?.program
      ? `${finance.program}${finance.level ? ` · ${finance.level}` : ""}`
      : finance?.level ?? null;
    const fin = computeFinance(finance, allPayments ?? []);
    recap = { totalDue: fin.totalDue, totalPaid: fin.totalPaid, balance: fin.balance };
  } else {
    const { data: cand } = await supabase
      .from("inscription_requests")
      .select("full_name, email")
      .eq("id", payment.candidature_id)
      .maybeSingle();
    name = cand?.full_name || cand?.email || "Candidat";
  }

  const backHref = isPre
    ? "/espace/finance/preuves"
    : isStaff
      ? `/espace/finance/${payment.student_id}`
      : "/espace/mes-paiements";
  const backLabel = isPre ? "← Preuves à vérifier" : isStaff ? "← Retour au dossier" : "← Ma scolarité";

  const dateStr = new Date(payment.paid_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const verifyHref = verifyUrl(
    signDoc({
      t: "recu",
      m: mat,
      n: name,
      y: academicYear(),
      a: Number(payment.amount),
      d: dateStr,
    })
  );

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link
              href={backHref}
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              {backLabel}
            </Link>
            <PrintButton />
          </div>

          <div className="mt-6">
            <PaymentReceipt
              payment={payment}
              studentName={name}
              matricule={mat}
              verifyHref={verifyHref}
              level={formation}
              recap={recap}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
