import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { averageValue, averageOn20, mention } from "@/lib/grades";
import { SEMESTERS } from "@/lib/referentiel";
import { GradeValidateButton } from "@/components/espace/GradeValidateButton";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { matricule } from "@/lib/documents";
import { QrCode } from "@/components/espace/documents/QrCode";

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  type: string | null;
  coefficient: number | null;
  semester: string | null;
  status: string | null;
};

/**
 * Bulletin d'un étudiant, filtrable par semestre.
 * - Étudiant / parent : le bulletin officiel n'apparaît que si toutes les
 *   notes de la période sont validées par l'administration ; sinon « en attente ».
 * - Admin (manage) : voit toutes les notes + peut valider.
 */
export async function BulletinView({
  studentId,
  studentName,
  className,
  basePath,
  selectedSemester,
  manage = false,
}: {
  studentId: string;
  studentName: string;
  className?: string | null;
  basePath: string;
  selectedSemester?: string;
  manage?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, type, coefficient, semester, status")
    .eq("student_id", studentId)
    .order("created_at");
  const allGrades = (gradeRows ?? []) as Grade[];

  const present = new Set(
    allGrades.map((g) => g.semester).filter(Boolean) as string[]
  );
  const availableSemesters = SEMESTERS.filter((s) => present.has(s));
  const active =
    selectedSemester && present.has(selectedSemester) ? selectedSemester : null;
  const scoped = active
    ? allGrades.filter((g) => g.semester === active)
    : allGrades;

  const pending = scoped.filter((g) => g.status !== "valide");
  // Notes affichées : tout pour l'admin, seulement les validées sinon.
  const display = manage ? scoped : scoped.filter((g) => g.status === "valide");

  const courseIds = [...new Set(display.map((g) => g.course_id))];
  const courseTitle = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  const byCourse = new Map<string, Grade[]>();
  for (const g of display) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }
  const overall = averageValue(display);

  // Assiduité (système d'appel par séance).
  const { data: attRows } = await supabase
    .from("session_attendance")
    .select("present")
    .eq("student_id", studentId);
  const attTotal = (attRows ?? []).length;
  const attAbsent = (attRows ?? []).filter((a) => !a.present).length;
  const attRate =
    attTotal > 0 ? Math.round(((attTotal - attAbsent) / attTotal) * 100) : null;

  // Rang dans la classe (fonction sécurisée : ne renvoie que le rang).
  const { data: rankRows } = await supabase.rpc("student_rank", {
    p_student: studentId,
    p_semester: active ?? "",
  });
  const rankRow = Array.isArray(rankRows) ? rankRows[0] : null;
  const rank =
    rankRow && rankRow.rank != null
      ? {
          rank: rankRow.rank as number,
          total: rankRow.total as number,
          classAvg: rankRow.class_avg as number | null,
        }
      : null;

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

  // État « en attente » pour étudiant / parent.
  const awaiting = !manage && scoped.length > 0 && pending.length > 0;

  // Bulletin officiel (toutes notes validées) → vérifiable par QR.
  const official = !awaiting && pending.length === 0 && display.length > 0;
  const verifyHref = official
    ? verifyUrl(
        signDoc({
          t: "bulletin",
          m: matricule(studentId),
          n: studentName,
          y: active ?? "Toute l'année",
          a: overall ?? undefined,
        })
      )
    : null;

  return (
    <div>
      {availableSemesters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          {tab("Toute l'année", basePath, !active)}
          {availableSemesters.map((s) =>
            tab(s, `${basePath}?sem=${encodeURIComponent(s)}`, active === s)
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 print:rounded-none print:shadow-none print:ring-0">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="text-lg font-extrabold text-ipmd-black">IPMD</p>
            <p className="text-xs text-black/50">
              Institut Polytechnique des Métiers du Digital
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-ipmd-black">Bulletin de notes</p>
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

        {/* Bandeau admin : validation */}
        {manage && pending.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <p className="text-sm font-medium text-amber-800">
              {pending.length} note(s) en attente de validation
              {active ? ` (${active})` : ""}.
            </p>
            <GradeValidateButton
              studentId={studentId}
              semester={active ?? ""}
              count={pending.length}
            />
          </div>
        )}

        {scoped.length === 0 ? (
          <p className="mt-6 text-sm text-black/55">
            Aucune note pour cette période.
          </p>
        ) : awaiting ? (
          <div className="mt-6 rounded-xl bg-amber-50 p-5 text-center ring-1 ring-amber-200">
            <p className="text-2xl">⏳</p>
            <p className="mt-2 font-bold text-amber-800">
              Bulletin en attente de validation
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {pending.length} note(s) doivent encore être validées par
              l&apos;administration. Ton bulletin officiel sera disponible dès
              que ce sera fait.
            </p>
          </div>
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
                            {manage && g.status !== "valide" && (
                              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                En attente
                              </span>
                            )}
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

            {rank && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-ipmd-red/5 px-5 py-3 text-sm ring-1 ring-ipmd-red/15">
                <span className="font-semibold text-black/60">
                  Rang dans la classe
                </span>
                <span className="font-bold text-ipmd-black">
                  {rank.rank === 1 ? "1er" : `${rank.rank}e`} / {rank.total}
                  {rank.classAvg != null
                    ? ` · moyenne de classe ${rank.classAvg}/20`
                    : ""}
                </span>
              </div>
            )}

            {attRate !== null && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-ipmd-light px-5 py-3 text-sm">
                <span className="font-semibold text-black/60">Assiduité</span>
                <span className="font-bold text-ipmd-black">
                  {attRate}% de présence · {attAbsent} absence{attAbsent > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ipmd-black px-5 py-4 text-white">
              <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Moyenne {active ? "du semestre" : "générale"}
                {manage && pending.length > 0 ? " (provisoire)" : ""}
              </span>
              <span className="text-2xl font-extrabold">
                {overall !== null ? `${overall}/20` : "—"}
                <span className="ml-3 text-base font-semibold text-ipmd-red-light">
                  {mention(overall)}
                </span>
              </span>
            </div>

            {verifyHref && (
              <div className="mt-6 flex items-center gap-3 border-t border-black/10 pt-4 print:break-inside-avoid">
                <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
                  <QrCode value={verifyHref} size={64} />
                </span>
                <div className="text-[11px] text-black/45">
                  <p className="font-semibold text-ipmd-black">Bulletin vérifiable</p>
                  <p>
                    Scannez ce QR · Signé numériquement par l&apos;IPMD ·
                    ipmd.pro/verifier
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
