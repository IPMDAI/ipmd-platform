import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { averageValue, averageOn20, mention } from "@/lib/grades";
import { SEMESTERS } from "@/lib/referentiel";

export const metadata: Metadata = {
  title: "Mes notes",
};

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  type: string | null;
  coefficient: number | null;
  comment: string | null;
  semester: string | null;
};

export default async function MesNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>;
}) {
  const { sem } = await searchParams;
  const { supabase, userId } = await requireUser();

  const { data: gradeRows } = await supabase
    .from("grades")
    .select(
      "id, course_id, title, score, max_score, type, coefficient, comment, semester, created_at"
    )
    .eq("student_id", userId)
    .order("created_at", { ascending: false });
  const all = (gradeRows ?? []) as Grade[];

  // Semestres présents.
  const present = new Set(all.map((g) => g.semester).filter(Boolean) as string[]);
  const availableSemesters = SEMESTERS.filter((s) => present.has(s));
  const active = sem && present.has(sem) ? sem : null;
  const grades = active ? all.filter((g) => g.semester === active) : all;

  // Titres des modules.
  const courseIds = [...new Set(grades.map((g) => g.course_id))];
  const courseTitle = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  const byCourse = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }

  const overall = averageValue(grades);

  const tab = (label: string, href: string, on: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        on
          ? "bg-ipmd-red text-white"
          : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
      }`}
    >
      {label}
    </Link>
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
            Mes notes
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Tes résultats par module, notes de classe et examen.
          </p>

          {/* Onglets semestre */}
          {availableSemesters.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tab("Toute l'année", "/espace/mes-notes", !active)}
              {availableSemesters.map((s) =>
                tab(s, `/espace/mes-notes?sem=${encodeURIComponent(s)}`, active === s)
              )}
            </div>
          )}

          {grades.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune note pour cette période. Elles apparaîtront dès que ton
              enseignant les aura saisies.
            </p>
          ) : (
            <>
              {/* Moyenne générale */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ipmd-black px-5 py-4 text-white">
                <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Moyenne {active ? "du semestre" : "générale"}
                </span>
                <span className="text-2xl font-extrabold">
                  {overall !== null ? `${overall}/20` : "—"}
                  <span className="ml-3 text-base font-semibold text-ipmd-red-light">
                    {mention(overall)}
                  </span>
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {[...byCourse.entries()].map(([courseId, list]) => {
                  const classe = list.filter((g) => g.type !== "examen");
                  const examen = list.filter((g) => g.type === "examen");
                  return (
                    <div
                      key={courseId}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-5 py-4">
                        <h2 className="font-bold text-ipmd-black">
                          {courseTitle.get(courseId) ?? "Module"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {classe.length > 0 && (
                            <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60">
                              Classe {averageOn20(classe)}
                            </span>
                          )}
                          {examen.length > 0 && (
                            <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60">
                              Examen {averageOn20(examen)}
                            </span>
                          )}
                          <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                            Moyenne {averageOn20(list)}
                          </span>
                        </div>
                      </div>
                      <ul className="divide-y divide-black/5">
                        {list.map((g) => (
                          <li
                            key={g.id}
                            className="flex items-start justify-between gap-3 px-5 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-ipmd-black">
                                {g.title}
                                <span
                                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    g.type === "examen"
                                      ? "bg-ipmd-red/10 text-ipmd-red"
                                      : "bg-ipmd-light text-black/50"
                                  }`}
                                >
                                  {g.type === "examen" ? "Examen" : "Classe"}
                                </span>
                                <span className="ml-2 text-[11px] text-black/40">
                                  coef. {Number(g.coefficient ?? 1)}
                                </span>
                              </p>
                              {g.comment && (
                                <p className="mt-0.5 text-xs italic text-black/45">
                                  {g.comment}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 rounded-lg bg-ipmd-light px-2.5 py-1 text-sm font-bold text-ipmd-black">
                              {Number(g.score)}/{Number(g.max_score)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
