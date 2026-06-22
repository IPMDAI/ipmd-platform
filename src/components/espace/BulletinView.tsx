import { createClient } from "@/lib/supabase/server";
import { averageValue, averageOn20, mention } from "@/lib/grades";

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  type: string | null;
  coefficient: number | null;
};

/**
 * Bulletin d'un étudiant (à partir de ses notes). La RLS garantit que seul
 * l'étudiant, son parent ou un admin peut le consulter.
 */
export async function BulletinView({
  studentId,
  studentName,
  className,
}: {
  studentId: string;
  studentName: string;
  className?: string | null;
}) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, type, coefficient")
    .eq("student_id", studentId)
    .order("created_at");
  const grades = (gradeRows ?? []) as Grade[];

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

  return (
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
          <p className="text-sm font-bold text-ipmd-black">Bulletin de notes</p>
          {className && <p className="text-xs text-black/50">{className}</p>}
        </div>
      </div>

      <p className="mt-4 text-sm">
        Étudiant : <span className="font-bold text-ipmd-black">{studentName}</span>
      </p>

      {grades.length === 0 ? (
        <p className="mt-6 text-sm text-black/55">
          Aucune note enregistrée pour l&apos;instant.
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
              Moyenne générale
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
  );
}
