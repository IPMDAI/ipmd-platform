import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import {
  SetFinanceForm,
  AddPaymentForm,
  AddScheduleForm,
  AccessForm,
  EmailProformaButton,
} from "@/components/espace/finance-forms";
import { deletePayment, deleteSchedule } from "@/lib/finance-actions";
import { ReceiptSendPanel } from "@/components/espace/ReceiptSendPanel";
import {
  formatFCFA,
  computeSchedule,
  computeFinance,
  deriveFinancialStatus,
  SCHED_STATUS,
  FINANCIAL_STATUS,
  ACCESS_STATES,
} from "@/lib/finance";

export const metadata: Metadata = {
  title: "Finance — étudiant",
};

const STAFF = ["admin", "super_admin", "scolarite"];

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function StudentFinancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const [{ data: finance }, { data: paymentRows }, { data: scheduleRows }, { data: levels }] =
    await Promise.all([
      supabase
        .from("student_finance")
        .select(
          "registration_fee, tuition_due, discount_rate, level, status, access_state, negotiated, payer_note"
        )
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount, method, label, kind, reference, observation, paid_at")
        .eq("student_id", studentId)
        .order("paid_at", { ascending: false }),
      supabase
        .from("payment_schedules")
        .select("id, label, amount, due_date")
        .eq("student_id", studentId),
      supabase.from("tuition_levels").select("level, amount").order("sort_order"),
    ]);

  const payments = paymentRows ?? [];

  // Destinataires (étudiant + parents liés) + historique des envois de reçus.
  const paymentIds = payments.map((p) => p.id);
  const [{ data: parentLinks }, { data: sends }] = await Promise.all([
    supabase.from("parent_links").select("parent_id").eq("student_id", studentId),
    paymentIds.length
      ? supabase
          .from("receipt_sends")
          .select("payment_id, recipient, channel, sent_at")
          .in("payment_id", paymentIds)
          .order("sent_at", { ascending: true })
      : Promise.resolve({ data: [] as { payment_id: string; recipient: string; channel: string; sent_at: string }[] }),
  ]);
  const parentIds = (parentLinks ?? []).map((l) => l.parent_id);
  let parents: { id: string; full_name: string | null; email: string | null }[] = [];
  if (parentIds.length > 0) {
    const { data: pp } = await supabase.from("profiles").select("id, full_name, email").in("id", parentIds);
    parents = pp ?? [];
  }
  const recipients = [
    { target: "student", label: "Étudiant", email: student.email ?? null },
    ...parents.map((p) => ({
      target: p.id,
      label: `Parent : ${p.full_name || p.email || "—"}`,
      email: p.email ?? null,
    })),
  ];
  const sendsByPayment = new Map<string, { recipient: string; channel: string; sent_at: string }[]>();
  for (const s of sends ?? []) {
    const arr = sendsByPayment.get(s.payment_id) ?? [];
    arr.push(s);
    sendsByPayment.set(s.payment_id, arr);
  }
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ipmd.pro";

  const fin = computeFinance(finance, payments);
  const derivedStatus = finance?.status || deriveFinancialStatus(fin);
  const accessState = finance?.access_state || "actif";
  const statusInfo = FINANCIAL_STATUS[derivedStatus] ?? {
    label: derivedStatus,
    cls: "bg-black/5 text-black/60",
  };
  const scolaritySettled = fin.tuitionSettled || (fin.balance <= 0 && fin.totalDue > 0);

  const today = new Date().toISOString().slice(0, 10);
  const { rows: schedule } = computeSchedule(scheduleRows ?? [], fin.totalPaid, today);

  const droits = [
    { label: "Polo", ok: fin.registrationSettled },
    { label: "Tee-shirt", ok: fin.registrationSettled },
    { label: "Accès plateforme", ok: fin.registrationSettled },
    { label: "Carte étudiant", ok: fin.registrationSettled },
    { label: "Attestation d'inscription", ok: fin.registrationSettled },
    { label: "Certificat d'inscription", ok: scolaritySettled, lockNote: "scolarité soldée" },
  ];

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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              {student.full_name || student.email}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ACCESS_STATES[accessState]?.cls ?? ""}`}>
              {ACCESS_STATES[accessState]?.label ?? accessState}
            </span>
            {finance?.level && (
              <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-bold text-black/60">
                {finance.level}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/espace/proforma/${studentId}`}
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              🧾 Facture proforma
            </Link>
            <Link
              href={`/espace/releve/${studentId}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
            >
              📑 Relevé de paiement
            </Link>
            <EmailProformaButton studentId={studentId} />
          </div>

          {/* Résumé */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Total dû</p>
              <p className="mt-1 text-lg font-extrabold text-ipmd-black">{formatFCFA(fin.totalDue)}</p>
              <p className="mt-1 text-[11px] text-black/45">
                Inscription {formatFCFA(fin.registrationFee)} · Scolarité {formatFCFA(fin.tuitionNet)}
                {fin.discountRate > 0 ? ` (−${Math.round(fin.discountRate * 100)}%)` : ""}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Payé</p>
              <p className="mt-1 text-lg font-extrabold text-green-600">{formatFCFA(fin.totalPaid)}</p>
              <p className="mt-1 text-[11px] text-black/45">
                Inscription {formatFCFA(fin.paidInscription)} · Scolarité {formatFCFA(fin.paidScolarite)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Reste à payer</p>
              <p className={`mt-1 text-lg font-extrabold ${fin.balance <= 0 ? "text-green-600" : "text-ipmd-red"}`}>
                {fin.balance <= 0 ? "Soldé ✓" : formatFCFA(fin.balance)}
              </p>
            </div>
          </div>

          {/* Droits acquis */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
              Droits & documents
            </h2>
            <div className="flex flex-wrap gap-2">
              {droits.map((d) => (
                <span
                  key={d.label}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    d.ok ? "bg-green-50 text-green-700" : "bg-black/5 text-black/40"
                  }`}
                  title={!d.ok && d.lockNote ? `Disponible quand : ${d.lockNote}` : undefined}
                >
                  {d.ok ? "✅" : "🔒"} {d.label}
                </span>
              ))}
            </div>
          </div>

          {/* Échéancier */}
          {schedule.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">Échéancier</h2>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {schedule.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-ipmd-black">
                        {formatFCFA(s.amount)}
                        <span className="ml-2 text-xs font-normal text-black/45">
                          {s.label || "Échéance"}
                        </span>
                      </p>
                      <p className="text-xs text-black/50">Échéance : {formatDate(s.due_date)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${SCHED_STATUS[s.status].cls}`}>
                        {SCHED_STATUS[s.status].label}
                      </span>
                      <form action={deleteSchedule.bind(null, studentId, s.id)}>
                        <button type="submit" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10">
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
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">Paiements</h2>
              {payments.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {payments.map((p) => (
                    <li key={p.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ipmd-black">
                          {formatFCFA(p.amount)}
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.kind === "inscription"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-ipmd-light text-black/55"
                            }`}
                          >
                            {p.kind === "inscription" ? "Inscription" : "Scolarité"}
                          </span>
                        </p>
                        <p className="truncate text-xs text-black/50">
                          {formatDate(p.paid_at)}
                          {p.method && ` · ${p.method}`}
                          {p.reference && ` · réf. ${p.reference}`}
                          {p.label && ` · ${p.label}`}
                        </p>
                        {p.observation && (
                          <p className="truncate text-[11px] italic text-black/40">{p.observation}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/espace/recu/${p.id}`}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ipmd-black transition-colors hover:bg-black/5"
                        >
                          Reçu
                        </Link>
                        <form action={deletePayment.bind(null, studentId, p.id)}>
                          <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10">
                            Suppr.
                          </button>
                        </form>
                      </div>
                      </div>
                      <ReceiptSendPanel
                        paymentId={p.id}
                        recipients={recipients}
                        receiptUrl={`${SITE}/espace/recu/${p.id}`}
                        history={sendsByPayment.get(p.id) ?? []}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaires */}
            <div className="order-1 space-y-6 lg:order-2">
              <SetFinanceForm
                studentId={studentId}
                registrationFee={fin.registrationFee || 300000}
                tuitionDue={fin.tuitionDue}
                level={finance?.level ?? null}
                discountApplied={fin.discountRate > 0}
                levels={(levels ?? []).map((l) => ({ level: l.level, amount: Number(l.amount) }))}
              />
              <AddPaymentForm studentId={studentId} />
              <AccessForm
                studentId={studentId}
                status={finance?.status ?? null}
                accessState={accessState}
                negotiated={finance?.negotiated ?? false}
                payerNote={finance?.payer_note ?? null}
              />
              <AddScheduleForm studentId={studentId} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
