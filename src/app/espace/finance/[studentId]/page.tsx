import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  SetDueForm,
  AddPaymentForm,
  AddScheduleForm,
} from "@/components/espace/finance-forms";
import { deletePayment, deleteSchedule } from "@/lib/finance-actions";
import { formatFCFA, computeSchedule, SCHED_STATUS } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Finance — étudiant",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function StudentFinancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requireAdmin();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const [{ data: finance }, { data: paymentRows }, { data: scheduleRows }] =
    await Promise.all([
      supabase
        .from("student_finance")
        .select("total_due")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount, method, label, paid_at")
        .eq("student_id", studentId)
        .order("paid_at", { ascending: false }),
      supabase
        .from("payment_schedules")
        .select("id, label, amount, due_date")
        .eq("student_id", studentId),
    ]);

  const totalDue = Number(finance?.total_due ?? 0);
  const payments = paymentRows ?? [];
  const totalPaid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const balance = totalDue - totalPaid;

  const today = new Date().toISOString().slice(0, 10);
  const { rows: schedule } = computeSchedule(
    scheduleRows ?? [],
    totalPaid,
    today
  );

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace/finance"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Finance
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {student.full_name || student.email}
          </h1>

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

          {/* Échéancier */}
          {schedule.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">
                Échéancier
              </h2>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {schedule.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ipmd-black">
                        {formatFCFA(s.amount)}
                        <span className="ml-2 text-xs font-normal text-black/45">
                          {s.label || "Échéance"}
                        </span>
                      </p>
                      <p className="text-xs text-black/50">
                        Échéance : {formatDate(s.due_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${SCHED_STATUS[s.status].cls}`}
                      >
                        {SCHED_STATUS[s.status].label}
                      </span>
                      <form action={deleteSchedule.bind(null, studentId, s.id)}>
                        <button
                          type="submit"
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                        >
                          Suppr.
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Historique des paiements */}
            <div className="order-2 lg:order-1">
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">
                Paiements
              </h2>
              {payments.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
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
                      <form action={deletePayment.bind(null, studentId, p.id)}>
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                        >
                          Suppr.
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaires */}
            <div className="order-1 space-y-6 lg:order-2">
              <SetDueForm studentId={studentId} current={totalDue} />
              <AddPaymentForm studentId={studentId} />
              <AddScheduleForm studentId={studentId} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
