import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { formatFCFA, computeSchedule, SCHED_STATUS } from "@/lib/finance";

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

  const [{ data: finance }, { data: paymentRows }, { data: scheduleRows }] =
    await Promise.all([
      supabase
        .from("student_finance")
        .select("total_due, access_state, status")
        .eq("student_id", userId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount, method, label, paid_at")
        .eq("student_id", userId)
        .order("paid_at", { ascending: false }),
      supabase
        .from("payment_schedules")
        .select("id, label, amount, due_date")
        .eq("student_id", userId),
    ]);

  const totalDue = Number(finance?.total_due ?? 0);
  const payments = paymentRows ?? [];
  const totalPaid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const balance = totalDue - totalPaid;

  const access = finance?.access_state ?? "actif";
  const fStatus = finance?.status ?? "";
  const alertMsg =
    access === "bloque"
      ? "Ton accès est temporairement bloqué pour régularisation de ta scolarité. Contacte la scolarité (scolarite@ipmd.pro)."
      : access === "pause"
        ? "Ton accès est en pause. Merci de régulariser ta situation auprès de la scolarité."
        : fStatus === "avertissement" || fStatus === "non_a_jour"
          ? "Ta scolarité n'est pas à jour. Merci de régulariser pour éviter une suspension d'accès."
          : null;

  const today = new Date().toISOString().slice(0, 10);
  const { rows: schedule, next } = computeSchedule(
    scheduleRows ?? [],
    totalPaid,
    today
  );

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
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/espace/proforma/${userId}`}
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              🧾 Ma facture proforma
            </Link>
            <Link
              href={`/espace/releve/${userId}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
            >
              📑 Mon relevé de paiement
            </Link>
          </div>

          {alertMsg && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm font-medium ring-1 ${
                access === "bloque"
                  ? "bg-ipmd-red/10 text-ipmd-red ring-ipmd-red/20"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}
            >
              <span className="text-lg leading-none">⚠️</span>
              <span>{alertMsg}</span>
            </div>
          )}

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

          {/* Prochain paiement */}
          {next && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ipmd-black px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Prochain paiement
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {formatFCFA(next.amount)}
                  <span className="ml-2 text-sm font-medium text-white/70">
                    {next.label || "Échéance"}
                  </span>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  next.status === "retard"
                    ? "bg-ipmd-red text-white"
                    : "bg-white/15 text-white"
                }`}
              >
                {next.status === "retard" ? "En retard depuis le" : "Avant le"}{" "}
                {formatDate(next.due_date)}
              </span>
            </div>
          )}

          {/* Échéancier */}
          {schedule.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-bold text-ipmd-black">
                Échéancier
              </h2>
              <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${SCHED_STATUS[s.status].cls}`}
                    >
                      {SCHED_STATUS[s.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

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
                  <Link
                    href={`/espace/recu/${p.id}`}
                    className="shrink-0 rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black transition-colors hover:bg-black/5"
                  >
                    🧾 Reçu
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
