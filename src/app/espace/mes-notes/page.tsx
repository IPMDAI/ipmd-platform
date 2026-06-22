import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Mes notes",
};

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  comment: string | null;
};

/** Moyenne ramenée sur 20 à partir des pourcentages. */
function average(grades: Grade[]): string {
  if (grades.length === 0) return "—";
  const sum = grades.reduce(
    (acc, g) => acc + (Number(g.score) / Number(g.max_score)) * 20,
    0
  );
  const moy = sum / grades.length;
  return `${Math.round(moy * 100) / 100}/20`;
}

export default async function MesNotesPage() {
  const { supabase, userId } = await requireUser();

  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, comment, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  const grades = (gradeRows ?? []) as Grade[];

  // Titres des cours concernés.
  const courseIds = [...new Set(grades.map((g) => g.course_id))];
  const courseTitle = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  // Regroupe par cours.
  const byCourse = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }

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
            Tes résultats par cours, avec ta moyenne.
          </p>

          {grades.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune note pour l&apos;instant. Elles apparaîtront ici dès que ton
              enseignant les aura saisies.
            </p>
          ) : (
            <div className="mt-8 space-y-6">
              {[...byCourse.entries()].map(([courseId, list]) => (
                <div
                  key={courseId}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                    <h2 className="font-bold text-ipmd-black">
                      {courseTitle.get(courseId) ?? "Cours"}
                    </h2>
                    <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                      Moyenne {average(list)}
                    </span>
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
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
