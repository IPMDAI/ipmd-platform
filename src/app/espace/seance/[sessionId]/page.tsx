import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { AttendanceForm } from "@/components/espace/AttendanceForm";
import { SessionReportForm } from "@/components/espace/SessionReportForm";
import { formatTime, DAY_LABELS } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Séance",
};

function dayLabel(iso: string): string {
  const js = new Date(iso + "T00:00:00Z").getUTCDay();
  const dow = js === 0 ? 7 : js;
  const [, m, d] = iso.split("-");
  return `${DAY_LABELS[dow] ?? ""} ${d}/${m}/${iso.slice(0, 4)}`;
}

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { supabase, userId } = await requireUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = me?.role ?? "";
  const isStaff = ["admin", "super_admin", "pedagogie"].includes(role);

  const { data: session } = await supabase
    .from("course_sessions")
    .select("id, class_id, teacher_id, subject, session_date, start_time, end_time")
    .eq("id", sessionId)
    .single();
  if (!session) notFound();
  if (session.teacher_id !== userId && !isStaff) redirect("/espace");

  // Élèves de la classe + appel existant.
  const { data: members } = await supabase
    .from("class_members")
    .select("student_id")
    .eq("class_id", session.class_id);
  const studentIds = (members ?? []).map((m) => m.student_id);

  const name = new Map<string, string>();
  const present = new Map<string, boolean>();
  if (studentIds.length > 0) {
    const [{ data: people }, { data: att }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", studentIds),
      supabase
        .from("session_attendance")
        .select("student_id, present")
        .eq("session_id", sessionId),
    ]);
    for (const p of people ?? [])
      name.set(p.id, p.full_name || p.email || "Étudiant");
    for (const a of att ?? []) present.set(a.student_id, a.present);
  }
  const students = studentIds.map((id) => ({
    id,
    name: name.get(id) ?? "Étudiant",
    present: present.get(id) ?? true,
  }));

  const { data: report } = await supabase
    .from("session_reports")
    .select("content, actual_start, actual_end, supports, homework, observations, present_count, absent_count, validated")
    .eq("session_id", sessionId)
    .maybeSingle();

  // Anti-triche : l'enseignant ne remplit la fiche que le jour du cours.
  const today = new Date().toISOString().slice(0, 10);
  const editable = isStaff || session.session_date === today;

  const { data: klass } = await supabase
    .from("classes")
    .select("name")
    .eq("id", session.class_id)
    .single();

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href={isStaff ? "/espace/seances" : "/espace/mes-seances"}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Séances
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {session.subject}
          </h1>
          <p className="mt-1 text-sm capitalize text-black/55">
            {dayLabel(session.session_date)} ·{" "}
            {formatTime(session.start_time)}–{formatTime(session.end_time)} ·{" "}
            {klass?.name ?? "Classe"}
          </p>

          {/* Appel */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-lg font-bold text-ipmd-black">
              Appel — présence des étudiants
            </h2>
            {students.length === 0 ? (
              <p className="text-sm text-black/55">
                Aucun étudiant affecté à cette classe.
              </p>
            ) : (
              <AttendanceForm sessionId={sessionId} students={students} />
            )}
          </div>

          {/* Fiche pédagogique */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-bold text-ipmd-black">
              Fiche pédagogique
            </h2>
            <SessionReportForm sessionId={sessionId} report={report ?? {}} editable={editable} />
          </div>
        </div>
      </Container>
    </section>
  );
}
