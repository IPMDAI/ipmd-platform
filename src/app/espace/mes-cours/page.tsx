import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Mes cours",
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function MesCoursPage() {
  const { supabase, userId } = await requireUser();

  const { data: enr } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", userId);
  const ids = [...new Set((enr ?? []).map((e) => e.course_id))];

  type CourseCard = {
    id: string;
    title: string;
    field: string | null;
    teacher: string | null;
    lessonsTotal: number;
    lessonsDone: number;
    supports: number;
    devoirs: number;
    nextDate: string | null;
    progression: number | null;
  };
  let cards: CourseCard[] = [];

  if (ids.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: courses }, { data: lessons }, { data: assigns }] =
      await Promise.all([
        supabase
          .from("courses")
          .select("id, title, field, teacher_id")
          .in("id", ids)
          .order("title"),
        supabase
          .from("course_lessons")
          .select("course_id, lesson_date, resources")
          .in("course_id", ids),
        supabase.from("assignments").select("course_id").in("course_id", ids),
      ]);

    const teacherIds = [
      ...new Set(
        (courses ?? []).map((c) => c.teacher_id).filter(Boolean) as string[]
      ),
    ];
    const teacherName = new Map<string, string>();
    if (teacherIds.length > 0) {
      const { data: t } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", teacherIds);
      for (const p of t ?? []) teacherName.set(p.id, p.full_name || p.email);
    }

    const devoirCount = new Map<string, number>();
    for (const a of assigns ?? [])
      devoirCount.set(a.course_id, (devoirCount.get(a.course_id) ?? 0) + 1);

    cards = (courses ?? []).map((c) => {
      const ls = (lessons ?? []).filter((l) => l.course_id === c.id);
      const total = ls.length;
      const done = ls.filter((l) => l.lesson_date <= today).length;
      const supports = ls.filter(
        (l) => l.resources && String(l.resources).trim() !== ""
      ).length;
      const upcoming = ls
        .filter((l) => l.lesson_date >= today)
        .sort((a, b) => (a.lesson_date < b.lesson_date ? -1 : 1));
      return {
        id: c.id,
        title: c.title,
        field: c.field,
        teacher: c.teacher_id ? teacherName.get(c.teacher_id) ?? null : null,
        lessonsTotal: total,
        lessonsDone: done,
        supports,
        devoirs: devoirCount.get(c.id) ?? 0,
        nextDate: upcoming[0]?.lesson_date ?? null,
        progression: total > 0 ? Math.round((done / total) * 100) : null,
      };
    });
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mes cours
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Tes cours, leur avancement et la prochaine séance. Ouvre-en un pour
            les supports, devoirs et séances.
          </p>

          {cards.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Tu n&apos;es inscrit·e à aucun cours pour l&apos;instant. Ton
              enseignant t&apos;inscrira à ses cours.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {cards.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/espace/mes-cours/${c.id}`}
                    className="block h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-bold text-ipmd-black">
                        {c.title}
                      </h2>
                      {c.field && (
                        <span className="shrink-0 rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
                          {c.field}
                        </span>
                      )}
                    </div>
                    {c.teacher && (
                      <p className="mt-0.5 text-xs text-black/55">
                        👤 {c.teacher}
                      </p>
                    )}

                    {/* Progression */}
                    {c.progression !== null && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-black/50">
                          <span>Progression</span>
                          <span>
                            {c.lessonsDone}/{c.lessonsTotal} séances ·{" "}
                            {c.progression}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-ipmd-light">
                          <div
                            className="h-full rounded-full bg-ipmd-red"
                            style={{ width: `${c.progression}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Compteurs */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                        📎 {c.supports} support(s)
                      </span>
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                        📝 {c.devoirs} devoir(s)
                      </span>
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                        🗓️ {c.lessonsTotal} séance(s)
                      </span>
                    </div>

                    {c.nextDate && (
                      <p className="mt-3 text-xs font-medium text-ipmd-black">
                        ⏭️ Prochaine séance : {frDate(c.nextDate)}
                      </p>
                    )}

                    <span className="mt-3 inline-block text-xs font-semibold text-ipmd-red">
                      Ouvrir →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
