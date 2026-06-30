import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { mention } from "@/lib/grades";
import { SEMESTERS } from "@/lib/referentiel";
import { GradeValidateButton } from "@/components/espace/GradeValidateButton";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { matricule, academicYear } from "@/lib/documents";
import { QrCode } from "@/components/espace/documents/QrCode";
import { Cachet } from "@/components/espace/documents/Cachet";
import { OfficialFooter } from "@/components/espace/documents/OfficialFooter";

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

/** Note /20 (français : 16,53). */
function fmt(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(2).replace(".", ",");
}

function frDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Bulletin officiel IPMD (par semestre) : UE, ECTS, Moy. Classe /20,
 * Note Examen /40, Moy. Générale /20 = (Classe + Examen) ÷ 3, décision.
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

  const present = new Set(allGrades.map((g) => g.semester).filter(Boolean) as string[]);
  const availableSemesters = SEMESTERS.filter((s) => present.has(s));
  const active = selectedSemester && present.has(selectedSemester) ? selectedSemester : null;
  const scoped = active ? allGrades.filter((g) => g.semester === active) : allGrades;

  const pending = scoped.filter((g) => g.status !== "valide");
  const display = manage ? scoped : scoped.filter((g) => g.status === "valide");

  // Métadonnées des cours (UE + ECTS).
  const courseIds = [...new Set(display.map((g) => g.course_id))];
  type CourseMeta = { title: string; ue_number: number | null; ue_name: string | null; ects: number };
  const courseMeta = new Map<string, CourseMeta>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, ue_number, ue_name, ects")
      .in("id", courseIds);
    for (const c of courses ?? [])
      courseMeta.set(c.id, {
        title: c.title,
        ue_number: c.ue_number ?? null,
        ue_name: c.ue_name ?? null,
        ects: Number(c.ects ?? 0),
      });
  }

  // Calcul par EC (élément constitutif = cours).
  type EC = {
    id: string;
    title: string;
    ects: number;
    moyClasse: number | null;
    noteExamen: number | null; // /40
    moyGen: number | null; // /20
    valide: boolean;
  };
  const byCourse = new Map<string, Grade[]>();
  for (const g of display) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }
  const ecs: EC[] = [...byCourse.entries()].map(([cid, list]) => {
    const meta = courseMeta.get(cid);
    const classe = list.filter((g) => g.type !== "examen");
    const exam = list.filter((g) => g.type === "examen");
    const avg = (arr: Grade[], scale: number) =>
      arr.length === 0
        ? null
        : arr.reduce((s, g) => s + (Number(g.score) / Number(g.max_score)) * scale, 0) / arr.length;
    const moyClasse = avg(classe, 20);
    const noteExamen = avg(exam, 40);
    let moyGen: number | null = null;
    if (moyClasse !== null && noteExamen !== null) moyGen = (moyClasse + noteExamen) / 3;
    else if (moyClasse !== null) moyGen = moyClasse;
    else if (noteExamen !== null) moyGen = noteExamen / 2;
    return {
      id: cid,
      title: meta?.title ?? "Matière",
      ects: meta?.ects ?? 0,
      moyClasse,
      noteExamen,
      moyGen,
      valide: moyGen !== null && moyGen >= 10,
    };
  });

  // Groupement par UE.
  const ueMap = new Map<number, { name: string; ecs: EC[] }>();
  for (const cid of byCourse.keys()) {
    const meta = courseMeta.get(cid);
    const num = meta?.ue_number ?? 0;
    if (!ueMap.has(num)) ueMap.set(num, { name: meta?.ue_name ?? "", ecs: [] });
  }
  for (const ec of ecs) {
    const meta = courseMeta.get(ec.id);
    const num = meta?.ue_number ?? 0;
    ueMap.get(num)!.ecs.push(ec);
  }
  const ues = [...ueMap.entries()].sort((a, b) => a[0] - b[0]);

  // Moyenne semestrielle pondérée ECTS + ECTS capitalisés + décision.
  const totalEcts = ecs.reduce((s, e) => s + e.ects, 0);
  const weighted = ecs.reduce((s, e) => s + (e.moyGen ?? 0) * e.ects, 0);
  const moyenne =
    totalEcts > 0
      ? weighted / totalEcts
      : ecs.length > 0
        ? ecs.reduce((s, e) => s + (e.moyGen ?? 0), 0) / ecs.length
        : null;
  const ectsCapitalises = ecs.filter((e) => e.valide).reduce((s, e) => s + e.ects, 0);
  const semestreValide = moyenne !== null && moyenne >= 10;

  // Assiduité.
  const { data: attRows } = await supabase
    .from("session_attendance")
    .select("present")
    .eq("student_id", studentId);
  const attAbsent = (attRows ?? []).filter((a) => !a.present).length;

  // Rang.
  const { data: rankRows } = await supabase.rpc("student_rank", {
    p_student: studentId,
    p_semester: active ?? "",
  });
  const rankRow = Array.isArray(rankRows) ? rankRows[0] : null;

  // État civil + niveau + année.
  const [{ data: profile }, { data: fin }] = await Promise.all([
    supabase.from("profiles").select("birth_date, birth_place").eq("id", studentId).maybeSingle(),
    supabase.from("student_finance").select("level, academic_year").eq("student_id", studentId).maybeSingle(),
  ]);
  const annee = fin?.academic_year ?? academicYear();
  const niveau = fin?.level ?? className ?? "";

  const awaiting = !manage && scoped.length > 0 && pending.length > 0;
  const official = !awaiting && pending.length === 0 && display.length > 0;
  const verifyHref = official
    ? verifyUrl(
        signDoc({
          t: "bulletin",
          m: matricule(studentId),
          n: studentName,
          y: active ?? "Toute l'année",
          a: moyenne != null ? Math.round(moyenne * 100) / 100 : undefined,
        })
      )
    : null;

  const tab = (label: string, href: string, on: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        on ? "bg-ipmd-red text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      {availableSemesters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          {tab("Toute l'année", basePath, !active)}
          {availableSemesters.map((s) => tab(s, `${basePath}?sem=${encodeURIComponent(s)}`, active === s))}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 text-[13px] shadow-sm ring-1 ring-black/5 sm:p-8 print:rounded-none print:shadow-none print:ring-0">
        {/* En-tête officiel */}
        <div className="flex items-center gap-3 border-b-2 border-ipmd-red pb-3">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
            <Image src="/logo-ipmd.png" alt="IPMD" width={56} height={56} className="h-full w-full object-contain" />
          </span>
          <div className="text-center text-[11px] font-bold uppercase leading-tight text-ipmd-black sm:text-xs">
            Établissement privé d&apos;enseignement supérieur
            <br />
            dédié aux métiers du digital et de l&apos;intelligence artificielle
          </div>
        </div>

        <h2 className="mt-4 text-center text-lg font-extrabold uppercase tracking-wide text-ipmd-black">
          Bulletin de notes
        </h2>

        {/* Identité + cadre niveau */}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="text-sm">
            <p>
              Nom et Prénoms : <span className="font-bold text-ipmd-black">{studentName}</span>
            </p>
            {(profile?.birth_date || profile?.birth_place) && (
              <p>
                Né(e) le <span className="font-semibold">{frDate(profile?.birth_date)}</span>
                {profile?.birth_place ? ` à ${profile.birth_place}` : ""}
              </p>
            )}
            <p>
              Matricule : <span className="font-semibold">{matricule(studentId)}</span>
            </p>
          </div>
          <div className="rounded-lg border border-black/20 px-4 py-2 text-center text-xs">
            <p className="text-black/55">Année académique {annee}</p>
            {niveau && <p className="mt-1 font-bold uppercase text-ipmd-black">{niveau}</p>}
            {className && <p className="text-[11px] text-black/60">{className}</p>}
          </div>
        </div>

        {/* Bandeau admin : validation */}
        {manage && pending.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 print:hidden">
            <p className="text-sm font-medium text-amber-800">
              {pending.length} note(s) en attente de validation{active ? ` (${active})` : ""}.
            </p>
            <GradeValidateButton studentId={studentId} semester={active ?? ""} count={pending.length} />
          </div>
        )}

        {scoped.length === 0 ? (
          <p className="mt-6 text-sm text-black/55">Aucune note pour cette période.</p>
        ) : awaiting ? (
          <div className="mt-6 rounded-xl bg-amber-50 p-5 text-center ring-1 ring-amber-200">
            <p className="text-2xl">⏳</p>
            <p className="mt-2 font-bold text-amber-800">Bulletin en attente de validation</p>
            <p className="mt-1 text-sm text-amber-700">
              {pending.length} note(s) doivent encore être validées par l&apos;administration.
            </p>
          </div>
        ) : (
          <>
            {/* Tableau officiel */}
            <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-black/20">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-ipmd-light text-center text-[11px] font-bold uppercase text-ipmd-black">
                    <th className="border border-black/15 px-1 py-1.5">UE</th>
                    <th className="border border-black/15 px-2 py-1.5 text-left">Éléments constitutifs</th>
                    <th className="border border-black/15 px-1 py-1.5">ECTS</th>
                    <th className="border border-black/15 px-1 py-1.5">Moy. Classe /20</th>
                    <th className="border border-black/15 px-1 py-1.5">Note Examen /40</th>
                    <th className="border border-black/15 px-1 py-1.5">Moy. Gén. /20</th>
                    <th className="border border-black/15 px-1 py-1.5">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {ues.map(([num, ue]) => {
                    const ueEcts = ue.ecs.reduce((s, e) => s + e.ects, 0);
                    return (
                      <Fragment key={`ue-${num}`}>
                        <tr className="bg-black/[0.03] font-bold text-ipmd-black">
                          <td className="border border-black/15 px-1 py-1 text-center">{num > 0 ? num : "—"}</td>
                          <td className="border border-black/15 px-2 py-1 uppercase">{ue.name || "Unité d'enseignement"}</td>
                          <td className="border border-black/15 px-1 py-1 text-center">{ueEcts || ""}</td>
                          <td className="border border-black/15" colSpan={4} />
                        </tr>
                        {ue.ecs.map((ec) => (
                          <tr key={ec.id} className="text-center">
                            <td className="border border-black/15 px-1 py-1" />
                            <td className="border border-black/15 px-2 py-1 text-left text-black/80">{ec.title}</td>
                            <td className="border border-black/15 px-1 py-1">{ec.ects || ""}</td>
                            <td className="border border-black/15 px-1 py-1">{fmt(ec.moyClasse)}</td>
                            <td className="border border-black/15 px-1 py-1">
                              {ec.noteExamen != null ? fmt(ec.noteExamen) : "—"}
                            </td>
                            <td className="border border-black/15 px-1 py-1 font-bold text-ipmd-black">{fmt(ec.moyGen)}</td>
                            <td className={`border border-black/15 px-1 py-1 font-semibold ${ec.valide ? "text-green-700" : "text-ipmd-red"}`}>
                              {ec.valide ? "Validé" : "Ajourné"}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Synthèse */}
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-lg border border-black/15 p-3 text-[12px]">
                <p>Total des absences : <strong>{attAbsent} séance(s)</strong></p>
                {rankRow?.rank != null && (
                  <p className="mt-1">
                    Rang : <strong>{rankRow.rank === 1 ? "1er" : rankRow.rank + "e"} / {rankRow.total}</strong>
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-black/15 p-3 text-center text-[12px]">
                <p className="text-black/55">Moyenne semestrielle / 20</p>
                <p className="text-2xl font-extrabold text-ipmd-black">{fmt(moyenne)}</p>
                <p className="text-[11px] font-semibold text-ipmd-red">{mention(moyenne)}</p>
                <p className="mt-1 text-[11px] text-black/55">ECTS capitalisés : <strong>{ectsCapitalises}</strong>{totalEcts ? ` / ${totalEcts}` : ""}</p>
              </div>
              <div className={`flex flex-col items-center justify-center rounded-lg p-3 text-center font-bold ${semestreValide ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-ipmd-red/10 text-ipmd-red ring-1 ring-ipmd-red/20"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">Décision</p>
                <p className="mt-1">{semestreValide ? "Semestre validé" : "Semestre non validé"}</p>
              </div>
            </div>

            {/* Signature */}
            <div className="mt-8 flex items-end justify-between gap-6">
              {verifyHref ? (
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
                    <QrCode value={verifyHref} size={56} />
                  </span>
                  <p className="text-[10px] text-black/45">
                    Bulletin vérifiable<br />ipmd.pro/verifier
                  </p>
                </div>
              ) : (
                <span />
              )}
              <div className="text-center text-[12px]">
                <p className="font-bold text-ipmd-black">L&apos;Administrateur Général</p>
                <div className="my-1 flex h-16 items-center justify-center">
                  <Cachet size={96} />
                </div>
                <p className="font-bold text-ipmd-black">POODA ETTIEN AUBIN</p>
              </div>
            </div>

            <OfficialFooter nb="long" />
          </>
        )}
      </div>
    </div>
  );
}
