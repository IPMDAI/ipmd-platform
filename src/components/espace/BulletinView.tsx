import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { averageValue, averageOn20, mention } from "@/lib/grades";
import { SEMESTERS } from "@/lib/referentiel";

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  type: string | null;
  coefficient: number | null;
  semester: string | null;
};

/**
 * Bulletin d'un étudiant, filtrable par semestre. La RLS garantit que seul
 * l'étudiant, son parent ou un admin peut le consulter.
 */
export async function BulletinView({
  studentId,
  studentName,
  className,
  basePath,
  selectedSemester,
}: {
  studentId: string;
  studentName: string;
  className?: string | null;
  basePath: string;
  selectedSemester?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, type, coefficient, semester")
    .eq("student_id", studentId)
    .order("created_at");
  const allGrades = (gradeRows ?? []) as Grade[];

  // Semestres présents, dans l'ordre LMD.
  const present = new Set(
    allGrades.map((g) => g.semester).filter(Boolean) as string[]
  );
  const availableSemesters = SEMESTERS.filter((s) => present.has(s));

  // Filtrage selon le semestre choisi.
  const active = selectedSemester && present.has(selectedSemester)
    ? selectedSemester
    : null;
  const grades = active
    ? allGrades.filter((g) => g.semester === active)
    : allGrades;

  // Titres des matières.
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

  const tab = (label: string, href: string, isActive: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        isActive
          ? "bg-ipmd-red text-white"
          : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      {/* Onglets semestre */}
      {availableSemesters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          {tab("Toute l'année", basePath, !active)}
          {availableSemesters.map((s) =>
            tab(s, `${basePath}?sem=${encodeURIComponent(s)}`, active === s)
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        {/* En-tête bulletin */}
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="text-lg font-extrabold text-ipmd-black">IPMD</p>
            <p className="text-xs text-black/50">
              Institut Polytechnique des Métiers du Digital
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-ipmd-black">
              Bulletin de notes
            </p>
            <p className="text-xs text-black/50">
              {active ?? "Toute l'année"}
              {className ? ` · ${className}` : ""}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm">
          Étudiant :{" "}
          <span className="font-bold text-ipmd-black">{studentName}</span>
        </p>

        {grades.length === 0 ? (
          <p className="mt-6 text-sm text-black/55">
            Aucune note pour cette période.
          </p>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              {[...byCourse.entries()].map(([cid, list]) => (
                <div
                  key={cid}
                  className="overflow-hidden rounded-xl ring-1 ring-black/10"
                >
                  <div className="flex items-center justify-between gap-3 bg-ipmd-light px-4 py-2">
                    <span className="font-bold text-ipmd-black">
                      {courseTitle.get(cid) ?? "Matière"}
                    </span>
                    <span className="text-sm font-bold text-ipmd-red">
                      Moy. {averageOn20(list)}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {list.map((g) => (
                        <tr key={g.id} className="border-t border-black/5">
                          <td className="px-4 py-2 text-black/70">
                            {g.title}
                            <span className="ml-2 text-xs text-black/40">
                              ({g.type === "examen" ? "Examen" : "Classe"} · coef.{" "}
                              {Number(g.coefficient ?? 1)})
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-ipmd-black">
                            {Number(g.score)}/{Number(g.max_score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Moyenne générale */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ipmd-black px-5 py-4 text-white">
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
          </>
        )}
      </div>
    </div>
  );
}
