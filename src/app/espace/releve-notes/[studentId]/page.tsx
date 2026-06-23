import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { QrCode } from "@/components/espace/documents/QrCode";
import { averageValue, averageOn20, mention } from "@/lib/grades";
import { matricule, academicYear } from "@/lib/documents";
import { signDoc, verifyUrl } from "@/lib/doc-verify";

export const metadata: Metadata = { title: "Relevé de notes" };

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

export default async function ReleveNotesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requireUser();

  const { data: student } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", studentId)
    .single();
  if (!student) notFound();
  const name = student.full_name || student.email || "—";

  // Classe.
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", studentId)
    .maybeSingle();
  let className: string | null = null;
  if (member?.class_id) {
    const { data: klass } = await supabase
      .from("classes")
      .select("name")
      .eq("id", member.class_id)
      .single();
    className = klass?.name ?? null;
  }

  // Notes validées uniquement (relevé officiel).
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, type, coefficient, semester, status")
    .eq("student_id", studentId)
    .eq("status", "valide")
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

  // Rang (fonction sécurisée) + assiduité.
  const { data: rankRows } = await supabase.rpc("student_rank", {
    p_student: studentId,
    p_semester: "",
  });
  const rankRow = Array.isArray(rankRows) ? rankRows[0] : null;

  const { data: att } = await supabase
    .from("session_attendance")
    .select("present")
    .eq("student_id", studentId);
  const attTotal = (att ?? []).length;
  const attRate =
    attTotal > 0
      ? Math.round(((att ?? []).filter((a) => a.present).length / attTotal) * 100)
      : null;

  const official = grades.length > 0;
  const verifyHref = official
    ? verifyUrl(
        signDoc({
          t: "releve-notes",
          m: matricule(studentId),
          n: name,
          y: academicYear(),
          a: overall ?? undefined,
        })
      )
    : null;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
              ← Retour à l&apos;espace
            </Link>
            <PrintButton />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 print:rounded-none print:shadow-none print:ring-0">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src="/logo-ipmd.png" alt="IPMD" width={48} height={48} className="h-full w-full object-contain" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-ipmd-black">IPMD</p>
                  <p className="text-[11px] text-black/50">Institut Polytechnique des Métiers du Digital</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ipmd-black">Relevé de notes</p>
                <p className="text-[11px] text-black/50">{academicYear()}</p>
              </div>
            </div>

            <p className="mt-4 text-sm">
              Étudiant : <span className="font-bold text-ipmd-black">{name}</span>{" "}
              <span className="text-black/45">({matricule(studentId)})</span>
              {className ? ` · ${className}` : ""}
            </p>

            {grades.length === 0 ? (
              <p className="mt-6 text-sm text-black/55">
                Aucune note validée pour l&apos;instant.
              </p>
            ) : (
              <>
                <div className="mt-5 space-y-4">
                  {[...byCourse.entries()].map(([cid, list]) => (
                    <div key={cid} className="overflow-hidden rounded-xl ring-1 ring-black/10">
                      <div className="flex items-center justify-between gap-3 bg-ipmd-light px-4 py-2">
                        <span className="font-bold text-ipmd-black">{courseTitle.get(cid) ?? "Matière"}</span>
                        <span className="text-sm font-bold text-ipmd-red">Moy. {averageOn20(list)}</span>
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {list.map((g) => (
                            <tr key={g.id} className="border-t border-black/5">
                              <td className="px-4 py-2 text-black/70">
                                {g.title}
                                <span className="ml-2 text-xs text-black/40">
                                  ({g.type === "examen" ? "Examen" : "Classe"} · coef. {Number(g.coefficient ?? 1)}
                                  {g.semester ? ` · ${g.semester}` : ""})
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

                {/* Synthèse */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-ipmd-light px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-black/45">Moyenne générale</p>
                    <p className="text-lg font-extrabold text-ipmd-black">
                      {overall !== null ? `${overall}/20` : "—"}
                    </p>
                    <p className="text-[11px] font-semibold text-ipmd-red">{mention(overall)}</p>
                  </div>
                  <div className="rounded-xl bg-ipmd-light px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-black/45">Rang</p>
                    <p className="text-lg font-extrabold text-ipmd-black">
                      {rankRow?.rank != null
                        ? `${rankRow.rank === 1 ? "1er" : rankRow.rank + "e"} / ${rankRow.total}`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ipmd-light px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-black/45">Assiduité</p>
                    <p className="text-lg font-extrabold text-ipmd-black">
                      {attRate !== null ? `${attRate}%` : "—"}
                    </p>
                  </div>
                </div>

                {verifyHref && (
                  <div className="mt-6 flex items-center gap-3 border-t border-black/10 pt-4">
                    <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
                      <QrCode value={verifyHref} size={64} />
                    </span>
                    <div className="text-[11px] text-black/45">
                      <p className="font-semibold text-ipmd-black">Relevé vérifiable</p>
                      <p>Scannez ce QR · Signé numériquement par l&apos;IPMD · ipmd.pro/verifier</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
