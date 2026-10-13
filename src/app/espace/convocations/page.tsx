import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { ConvocationForm } from "@/components/espace/ConvocationForm";
import { cancelConvocation } from "@/lib/convocation-actions";
import { CONVOCATION_STATUS, convocationWhen, type Convocation } from "@/lib/convocations";

export const metadata: Metadata = {
  title: "Convocations",
};

export default async function ConvocationsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: students }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "etudiant")
      .order("full_name"),
    supabase
      .from("convocations")
      .select("id, student_id, title, reason, scheduled_at, location, status, created_at, acknowledged_at")
      .order("created_at", { ascending: false }),
  ]);

  const convocations = (rows ?? []) as Convocation[];
  const nameMap = new Map<string, string>();
  for (const s of students ?? []) nameMap.set(s.id, s.full_name || s.email);

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Convocations
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Convoquez un étudiant — l&apos;étudiant et ses parents sont notifiés.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr]">
            {/* Formulaire */}
            <div className="order-1">
              <ConvocationForm students={students ?? []} />
            </div>

            {/* Liste */}
            <div className="order-2">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">Historique</h2>
                <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-xs font-bold text-white">
                  {convocations.length}
                </span>
              </div>
              {convocations.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune convocation pour le moment.
                </p>
              ) : (
                <ul className="space-y-3">
                  {convocations.map((c) => {
                    const st = CONVOCATION_STATUS[c.status] ?? CONVOCATION_STATUS.envoyee;
                    const when = convocationWhen(c.scheduled_at);
                    return (
                      <li
                        key={c.id}
                        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-ipmd-black">{c.title}</p>
                            <p className="text-xs text-black/50">
                              👤 {nameMap.get(c.student_id) ?? "—"}
                              {when ? ` · 🗓️ ${when}` : ""}
                              {c.location ? ` · 📍 ${c.location}` : ""}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        {c.reason && (
                          <p className="mt-2 whitespace-pre-line text-sm text-black/65">
                            {c.reason}
                          </p>
                        )}
                        {c.status !== "annulee" && (
                          <form action={cancelConvocation.bind(null, c.id)} className="mt-2">
                            <button className="text-xs font-semibold text-black/40 hover:text-ipmd-red">
                              Annuler
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
