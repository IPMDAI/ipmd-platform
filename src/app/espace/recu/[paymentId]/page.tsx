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
    .select("id, student_id, amount, method, label, paid_at, kind, reference")
    .eq("id", paymentId)
    .single();
  if (!payment) notFound();

  const [{ data: me }, { data: student }, { data: finance }, { data: allPayments }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", payment.student_id)
      .single(),
    supabase
      .from("student_finance")
      .select("registration_fee, tuition_due, discount_rate, level, program")
      .eq("student_id", payment.student_id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("amount, kind")
      .eq("student_id", payment.student_id),
  ]);
  const isStaff = ["admin", "super_admin", "scolarite"].includes(me?.role ?? "");
  const backHref = isStaff ? `/espace/finance/${payment.student_id}` : "/espace/mes-paiements";
  const backLabel = isStaff ? "← Retour au dossier" : "← Ma scolarité";
  const formation = finance?.program
    ? `${finance.program}${finance.level ? ` · ${finance.level}` : ""}`
    : finance?.level ?? null;
  const name = student?.full_name || student?.email || "—";
  const mat = matricule(payment.student_id);
  const fin = computeFinance(finance, allPayments ?? []);

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
              recap={{
                totalDue: fin.totalDue,
                totalPaid: fin.totalPaid,
                balance: fin.balance,
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
