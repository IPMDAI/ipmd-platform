import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Mes cours",
};

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
    devoirs: number;
  };
  let cards: CourseCard[] = [];

  if (ids.length > 0) {
    const [{ data: courses }, { data: assigns }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, field, teacher_id")
        .in("id", ids)
        .order("title"),
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

    cards = (courses ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      field: c.field,
      teacher: c.teacher_id ? teacherName.get(c.teacher_id) ?? null : null,
      devoirs: devoirCount.get(c.id) ?? 0,
    }));
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

                    {/* Compteurs */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                        📝 {c.devoirs} devoir(s)
                      </span>
                    </div>

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
