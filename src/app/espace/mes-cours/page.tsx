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

  const ids = (enr ?? []).map((e) => e.course_id);

  let courses: {
    id: string;
    title: string;
    field: string | null;
    description: string | null;
  }[] = [];

  if (ids.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, title, field, description")
      .in("id", ids)
      .order("title");
    courses = data ?? [];
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
            Les cours auxquels tu es inscrit·e. Ouvre-en un pour voir ses
            devoirs et ses séances.
          </p>

          {courses.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Tu n&apos;es inscrit·e à aucun cours pour l&apos;instant. Ton
              enseignant t&apos;inscrira à ses cours.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/espace/mes-cours/${c.id}`}
                    className="block h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-bold text-ipmd-black">
                        {c.title}
                      </h2>
                      {c.field && (
                        <span className="shrink-0 rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
                          {c.field}
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-black/55">
                        {c.description}
                      </p>
                    )}
                    <span className="mt-2 inline-block text-xs font-semibold text-ipmd-red">
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
