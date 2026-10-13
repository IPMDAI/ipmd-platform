import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { StudentAttendance } from "@/components/espace/StudentAttendance";
import { StudentSessions } from "@/components/espace/StudentSessions";
import { AnnouncementsPanel } from "@/components/espace/AnnouncementsPanel";
import { ConvocationAck } from "@/components/espace/ConvocationAck";
import {
  CONVOCATION_STATUS,
  convocationWhen,
  type Convocation,
} from "@/lib/convocations";
import { DocumentUpload } from "@/components/espace/DocumentUpload";
import { DocDownloadButton } from "@/components/espace/DocDownloadButton";
import {
  DOC_STATUS,
  type StudentDocument,
  type DocSubmission,
} from "@/lib/student-documents";
import {
  WeeklyTimetable,
  type TimetableSlot,
} from "@/components/espace/WeeklyTimetable";
import { weekDates, weekLabel } from "@/lib/holidays";
import { averageOn20, averageValue, mention } from "@/lib/grades";
import { displayEmail } from "@/lib/academic";
import {
  formatFCFA,
  computeFinance,
  computeSchedule,
  SCHED_STATUS,
  type Installment,
} from "@/lib/finance";

export const metadata: Metadata = {
  title: "Suivi",
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
};

/** Aujourd'hui au format planning (1 = Lundi … 7 = Dimanche). */
function todayDow(): number {
  const js = new Date().getDay();
  return js === 0 ? 7 : js;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Libellé + couleur de l'état d'accès (inscription). */
const ACCESS_BADGE: Record<string, { label: string; cls: string }> = {
  actif: { label: "Inscrit · accès actif", cls: "bg-green-50 text-green-700" },
  pause: { label: "Accès en pause", cls: "bg-amber-50 text-amber-800" },
  bloque: { label: "Accès bloqué", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

export default async function EnfantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();

  // La RLS ne renvoie l'enfant que si l'utilisateur en est le parent (ou admin).
  const { data: child } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", id)
    .single();
  if (!child) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const viewerRole = me?.role ?? "parent";

  // Classe de l'enfant (RLS parent : policy « Parents read children class »).
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", id)
    .maybeSingle();

  let klass: {
    name: string | null;
    level: string | null;
    academic_year: string | null;
    filiere_id: string | null;
  } | null = null;
  let filiereName: string | null = null;
  if (member?.class_id) {
    const { data: k } = await supabase
      .from("classes")
      .select("name, level, academic_year, filiere_id")
      .eq("id", member.class_id)
      .single();
    klass = k ?? null;
    if (k?.filiere_id) {
      const { data: fil } = await supabase
        .from("filieres")
        .select("name")
        .eq("id", k.filiere_id)
        .single();
      filiereName = fil?.name ?? null;
    }
  }

  // Notes de l'enfant.
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, type, coefficient, comment, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false });
  const grades = (gradeRows ?? []) as Grade[];
  const byCourse = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }

  // Intitulés de cours (pour regrouper les notes).
  const courseTitle = new Map<string, string>();
  const gradeCourseIds = [...new Set(grades.map((g) => g.course_id))];
  if (gradeCourseIds.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", gradeCourseIds);
    for (const c of data ?? []) courseTitle.set(c.id, c.title);
  }

  // Présence (comptage pour le résumé).
  const { data: attRows } = await supabase
    .from("session_attendance")
    .select("present")
    .eq("student_id", id);
  const presentCount = (attRows ?? []).filter((a) => a.present).length;
  const absenceCount = (attRows ?? []).filter((a) => !a.present).length;

  // Finance : frais, paiements, échéancier.
  const [{ data: finance }, { data: payRows }, { data: schedRows }] =
    await Promise.all([
      supabase
        .from("student_finance")
        .select(
          "registration_fee, tuition_due, discount_rate, scholarship_amount, level, program, access_state"
        )
        .eq("student_id", id)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount, kind, status, label, method, paid_at")
        .eq("student_id", id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("payment_schedules")
        .select("id, label, amount, due_date")
        .eq("student_id", id),
    ]);

  const payments = payRows ?? [];
  const fin = computeFinance(finance, payments);
  const today = new Date().toISOString().slice(0, 10);
  const installments: Installment[] = (schedRows ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    amount: Number(s.amount),
    due_date: s.due_date,
  }));
  const { rows: schedule, next } = computeSchedule(installments, fin.paidScolarite, today);
  const paidPayments = payments.filter((p) => p.status == null || p.status === "paye");

  // Convocations de l'enfant (RLS parent : « Parent reads child convocations »).
  const { data: convocRows } = await supabase
    .from("convocations")
    .select("id, student_id, title, reason, scheduled_at, location, status, created_at, acknowledged_at")
    .eq("student_id", id)
    .neq("status", "annulee")
    .order("created_at", { ascending: false });
  const convocations = (convocRows ?? []) as Convocation[];
  // Accusés de réception de CE destinataire (individuels).
  let myAcks = new Set<string>();
  if (convocations.length > 0) {
    const { data: acks } = await supabase
      .from("convocation_acknowledgements")
      .select("convocation_id")
      .eq("user_id", userId)
      .in("convocation_id", convocations.map((c) => c.id));
    myAcks = new Set((acks ?? []).map((a) => a.convocation_id));
  }

  // Documents à fournir de l'enfant + historique des dépôts (RLS parent).
  const { data: docRows } = await supabase
    .from("student_documents")
    .select("id, student_id, label, doc_key, status, requested_at")
    .eq("student_id", id)
    .order("requested_at", { ascending: false });
  const studentDocs = (docRows ?? []) as StudentDocument[];
  const subsByDoc = new Map<string, DocSubmission[]>();
  if (studentDocs.length > 0) {
    const { data: subRows } = await supabase
      .from("student_document_submissions")
      .select("id, student_document_id, path, original_name, uploaded_by, uploaded_at, status, reviewed_at, review_note")
      .in("student_document_id", studentDocs.map((d) => d.id))
      .order("uploaded_at", { ascending: false });
    for (const s of (subRows ?? []) as DocSubmission[]) {
      const arr = subsByDoc.get(s.student_document_id) ?? [];
      arr.push(s);
      subsByDoc.set(s.student_document_id, arr);
    }
  }

  // Emploi du temps (timetable_slots de la classe — RLS « Parent reads class timetable »).
  const dates = weekDates();
  const { data: holidayRows } = await supabase
    .from("holidays")
    .select("day, label")
    .gte("day", dates[1])
    .lte("day", dates[6]);
  const holidays: Record<string, string> = {};
  for (const h of holidayRows ?? []) holidays[h.day] = h.label;

  let slots: TimetableSlot[] = [];
  if (member?.class_id) {
    const { data: rows } = await supabase
      .from("timetable_slots")
      .select("id, subject, teacher_id, room_id, day_of_week, start_time, end_time, status, type, modality")
      .eq("class_id", member.class_id)
      .order("start_time");
    const teacherIds = [...new Set((rows ?? []).map((r) => r.teacher_id).filter(Boolean))] as string[];
    const roomIds = [...new Set((rows ?? []).map((r) => r.room_id).filter(Boolean))] as string[];
    const teacherName = new Map<string, string>();
    if (teacherIds.length > 0) {
      const { data: t } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", teacherIds);
      for (const p of t ?? [])
        teacherName.set(p.id, p.full_name || displayEmail(p.email) || "Enseignant");
    }
    const roomName = new Map<string, string>();
    if (roomIds.length > 0) {
      const { data: r } = await supabase.from("rooms").select("id, name").in("id", roomIds);
      for (const x of r ?? []) roomName.set(x.id, x.name);
    }
    slots = (rows ?? []).map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      subject: s.subject,
      teacherName: s.teacher_id ? teacherName.get(s.teacher_id) : null,
      roomName: s.room_id ? roomName.get(s.room_id) : null,
      status: s.status ?? "prevu",
      type: s.type,
      modality: s.modality,
    }));
  }

  // Résumé en tête.
  const avg = averageValue(grades);
  const dow = todayDow();
  const todaySlots = slots
    .filter((s) => s.day_of_week === dow)
    .sort((a, b) => (a.start_time < b.start_time ? -1 : 1));

  const accessBadge = finance?.access_state
    ? ACCESS_BADGE[finance.access_state]
    : null;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/espace/mon-enfant"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Mes enfants
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {child.full_name || displayEmail(child.email) || "Mon enfant"}
          </h1>

          {/* Contexte scolarité : classe / filière / niveau / année / statut */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {klass?.name && (
              <span className="rounded-full bg-ipmd-black px-3 py-1 text-xs font-semibold text-white">
                {klass.name}
              </span>
            )}
            {filiereName && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ipmd-black ring-1 ring-black/10">
                {filiereName}
              </span>
            )}
            {klass?.level && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ipmd-black ring-1 ring-black/10">
                {klass.level}
              </span>
            )}
            {klass?.academic_year && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/55 ring-1 ring-black/10">
                {klass.academic_year}
              </span>
            )}
            {accessBadge && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${accessBadge.cls}`}>
                {accessBadge.label}
              </span>
            )}
          </div>

          {/* Actions documents */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/espace/bulletin/${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              📄 Voir le bulletin
            </Link>
            <Link
              href={`/espace/releve-notes/${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
            >
              📄 Relevé de notes
            </Link>
            <Link
              href={`/espace/documents?student=${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
            >
              🪪 Documents officiels
            </Link>
          </div>

          {/* Résumé : l'essentiel d'un coup d'œil */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Moyenne générale
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ipmd-black">
                {avg !== null ? `${avg}/20` : "—"}
              </p>
              {avg !== null && (
                <p className="text-xs font-semibold text-ipmd-red">{mention(avg)}</p>
              )}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Présence
              </p>
              <p className="mt-1 text-2xl font-extrabold text-green-600">
                {presentCount}
                <span className="text-sm font-semibold text-black/40"> prés.</span>
              </p>
              <p className="text-xs font-semibold text-ipmd-red">
                {absenceCount} absence(s)
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Reste à payer
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold ${
                  fin.balance <= 0 ? "text-green-600" : "text-ipmd-red"
                }`}
              >
                {fin.balance <= 0 ? "À jour" : formatFCFA(fin.balance)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Prochaine échéance
              </p>
              {next ? (
                <>
                  <p className="mt-1 text-lg font-extrabold text-ipmd-black">
                    {formatFCFA(next.amount)}
                  </p>
                  <p className="text-xs font-semibold text-black/55">
                    {fmtDate(next.due_date)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-lg font-extrabold text-green-600">
                  {schedule.length > 0 ? "Soldé ✓" : "—"}
                </p>
              )}
            </div>
          </div>

          {/* Aujourd'hui */}
          {todaySlots.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="font-bold text-ipmd-black">🗓️ Aujourd&apos;hui</h3>
              <ul className="mt-2 space-y-1.5">
                {todaySlots.map((s) => (
                  <li key={s.id} className="text-sm text-ipmd-black">
                    <span className="font-bold text-ipmd-red">
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>{" "}
                    {s.subject}
                    {s.roomName && (
                      <span className="text-black/45"> · 📍 {s.roomName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Convocations */}
          {convocations.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-ipmd-black">📨 Convocations</h2>
              <ul className="mt-3 space-y-3">
                {convocations.map((c) => {
                  const st = CONVOCATION_STATUS[c.status] ?? CONVOCATION_STATUS.envoyee;
                  const when = convocationWhen(c.scheduled_at);
                  return (
                    <li
                      key={c.id}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ipmd-red/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-ipmd-black">{c.title}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-black/55">
                        {when ? `🗓️ ${when}` : ""}
                        {c.location ? `${when ? " · " : ""}📍 ${c.location}` : ""}
                      </p>
                      {c.reason && (
                        <p className="mt-2 whitespace-pre-line text-sm text-black/70">
                          {c.reason}
                        </p>
                      )}
                      <div className="mt-3">
                        <ConvocationAck convocationId={c.id} acked={myAcks.has(c.id)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Documents à fournir */}
          {studentDocs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-ipmd-black">📎 Documents à fournir</h2>
              <ul className="mt-3 space-y-3">
                {studentDocs.map((d) => {
                  const st = DOC_STATUS[d.status] ?? DOC_STATUS.a_fournir;
                  const dsubs = subsByDoc.get(d.id) ?? [];
                  const latest = dsubs[0];
                  return (
                    <li key={d.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ipmd-black">{d.label}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      {latest?.status === "refuse" && latest.review_note && (
                        <p className="mt-1 text-xs text-ipmd-red">
                          Motif du refus : {latest.review_note}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <DocumentUpload studentId={id} studentDocumentId={d.id} label={d.label} />
                        {latest && <DocDownloadButton path={latest.path} label="Dernier dépôt" />}
                      </div>
                      {dsubs.length > 0 && (
                        <ul className="mt-2 space-y-0.5 border-t border-black/5 pt-2">
                          {dsubs.map((s) => {
                            const ss = DOC_STATUS[s.status] ?? DOC_STATUS.fourni;
                            return (
                              <li key={s.id} className="text-[11px] text-black/45">
                                {fmtDate(s.uploaded_at)} · {ss.label}
                                {s.status === "refuse" && s.review_note ? ` — ${s.review_note}` : ""}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Scolarité : totaux + échéancier + paiements/reçus */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Scolarité</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Total dû</p>
              <p className="mt-1 text-base font-extrabold text-ipmd-black">
                {formatFCFA(fin.totalDue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Payé</p>
              <p className="mt-1 text-base font-extrabold text-green-600">
                {formatFCFA(fin.totalPaid)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase text-black/40">Reste</p>
              <p
                className={`mt-1 text-base font-extrabold ${
                  fin.balance <= 0 ? "text-green-600" : "text-ipmd-red"
                }`}
              >
                {fin.balance <= 0 ? "Soldé ✓" : formatFCFA(fin.balance)}
              </p>
            </div>
          </div>

          {/* Échéancier */}
          {schedule.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-black/40">
                Échéancier
              </h3>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {schedule.map((s) => {
                  const st = SCHED_STATUS[s.status];
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ipmd-black">
                          {formatFCFA(s.amount)}
                          {s.label && (
                            <span className="ml-2 text-xs font-normal text-black/45">
                              {s.label}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-black/50">
                          Échéance : {fmtDate(s.due_date)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Paiements + reçus */}
          {paidPayments.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-black/40">
                Paiements & reçus
              </h3>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {paidPayments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ipmd-black">
                        {formatFCFA(p.amount)}
                        <span className="ml-2 rounded-full bg-ipmd-light px-2 py-0.5 text-[10px] font-bold text-black/55">
                          {p.kind === "inscription" ? "Inscription" : "Scolarité"}
                        </span>
                      </p>
                      <p className="text-xs text-black/50">
                        {fmtDate(p.paid_at)}
                        {p.method ? ` · ${p.method}` : ""}
                        {p.label ? ` · ${p.label}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/espace/recu/${p.id}`}
                      className="shrink-0 rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      📄 Reçu
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emploi du temps */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Emploi du temps</h2>
          {!member?.class_id ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              {child.full_name || "L'enfant"} n&apos;est affecté·e à aucune classe
              pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 space-y-6">
              <StudentSessions classId={member.class_id} />
              {slots.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-black/40">
                    Grille hebdomadaire type · semaine du {weekLabel(dates)}
                  </h3>
                  <WeeklyTimetable slots={slots} weekDates={dates} holidays={holidays} />
                </div>
              )}
            </div>
          )}

          {/* Présence */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Présence</h2>
          <div className="mt-3">
            <StudentAttendance studentId={id} />
          </div>

          {/* Notes */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Notes</h2>
          {grades.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune note pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 space-y-5">
              {[...byCourse.entries()].map(([cid, list]) => (
                <div
                  key={cid}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
                    <h3 className="font-bold text-ipmd-black">
                      {courseTitle.get(cid) ?? "Cours"}
                    </h3>
                    <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                      Moyenne {averageOn20(list)}
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
                            <span
                              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                g.type === "examen"
                                  ? "bg-ipmd-red/10 text-ipmd-red"
                                  : "bg-ipmd-light text-black/50"
                              }`}
                            >
                              {g.type === "examen" ? "Examen" : "Classe"}
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
              ))}
            </div>
          )}

          {/* Annonces de l'administration (audience parent / tout le monde) */}
          <AnnouncementsPanel role={viewerRole} userId={userId} />
        </div>
      </Container>
    </section>
  );
}
