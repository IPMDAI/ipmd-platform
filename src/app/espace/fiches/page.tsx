import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Fiches pédagogiques",
};

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function FichesPage() {
  const { supabase } = await requireAdmin();

  const { data: reports } = await supabase
    .from("session_reports")
    .select(
      "id, session_id, content, supports, homework, validated, present_count, absent_count"
    );

  const sessionIds = (reports ?? []).map((r) => r.session_id);
  const sMap = new Map<
    string,
    { subject: string; session_date: string; class_id: string; teacher_name: string | null }
  >();
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("course_sessions")
      .select("id, subject, session_date, class_id, teacher_name")
      .in("id", sessionIds);
    for (const s of sessions ?? [])
      sMap.set(s.id, {
        subject: s.subject,
        session_date: s.session_date,
        class_id: s.class_id,
        teacher_name: s.teacher_name,
      });
  }

  const classIds = [...new Set([...sMap.values()].map((s) => s.class_id))];
  const className = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);
    for (const c of classes ?? []) className.set(c.id, c.name);
  }

  const rows = (reports ?? [])
    .map((r) => {
      const s = sMap.get(r.session_id);
      return s ? { ...r, ...s } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => (a.session_date < b.session_date ? 1 : -1));

  const toValidate = rows.filter((r) => !r.validated).length;

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
            Fiches pédagogiques
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Fiches de séance remplies par les enseignants
            {toValidate > 0 ? ` · ${toValidate} à valider` : " · toutes validées"}.
          </p>

          <div className="mt-8">
            {rows.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucune fiche remplie. Les enseignants remplissent la fiche depuis
                chaque séance (Mes séances → une séance).
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/espace/seance/${r.session_id}`}
                      className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ipmd-black">
                            {r.subject}
                            <span className="ml-2 font-normal text-black/45">
                              {className.get(r.class_id) ?? "Classe"}
                            </span>
                          </p>
                          <p className="text-xs capitalize text-black/50">
                            {frDate(r.session_date)}
                            {r.teacher_name ? ` · ${r.teacher_name}` : ""}
                          </p>
                        </div>
                        {r.validated ? (
                          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                            Validée
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            À valider
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-black/55">
                        <span className="font-semibold text-black/60">Thèmes :</span>{" "}
                        {r.content || "Pas de thèmes saisis."}
                      </p>
                      {r.homework && (
                        <p className="mt-1 line-clamp-1 text-xs text-black/55">
                          <span className="font-semibold text-black/60">Travaux :</span> {r.homework}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] font-semibold text-black/45">
                        {r.present_count ?? 0} présent(s) · {r.absent_count ?? 0} absent(s)
                        {r.supports ? " · documents distribués" : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
