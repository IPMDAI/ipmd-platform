import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import {
  WeeklyTimetable,
  type TimetableSlot,
} from "@/components/espace/WeeklyTimetable";

export const metadata: Metadata = {
  title: "Mon emploi du temps",
};

export default async function MonEmploiDuTempsPage() {
  const { supabase, userId } = await requireUser();

  // Classe de l'étudiant.
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();

  let className: string | null = null;
  let slots: TimetableSlot[] = [];

  if (member?.class_id) {
    const { data: klass } = await supabase
      .from("classes")
      .select("name")
      .eq("id", member.class_id)
      .single();
    className = klass?.name ?? null;

    const { data: rows } = await supabase
      .from("timetable_slots")
      .select("id, subject, teacher_id, room_id, day_of_week, start_time, end_time")
      .eq("class_id", member.class_id)
      .order("start_time");

    const teacherIds = [
      ...new Set((rows ?? []).map((r) => r.teacher_id).filter(Boolean)),
    ] as string[];
    const roomIds = [
      ...new Set((rows ?? []).map((r) => r.room_id).filter(Boolean)),
    ] as string[];

    const teacherName = new Map<string, string>();
    if (teacherIds.length > 0) {
      const { data: t } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", teacherIds);
      for (const p of t ?? []) teacherName.set(p.id, p.full_name || p.email);
    }
    const roomName = new Map<string, string>();
    if (roomIds.length > 0) {
      const { data: r } = await supabase
        .from("rooms")
        .select("id, name")
        .in("id", roomIds);
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
    }));
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mon emploi du temps
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {className
              ? `Classe : ${className}`
              : "Ta classe et ton planning."}
          </p>

          {!member?.class_id ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Tu n&apos;es affecté·e à aucune classe pour l&apos;instant. La
              scolarité t&apos;ajoutera à ta promotion.
            </p>
          ) : slots.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun créneau planifié pour ta classe pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-8">
              <WeeklyTimetable slots={slots} />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
