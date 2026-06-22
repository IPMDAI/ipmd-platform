import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewCourseForm } from "@/components/espace/NewCourseForm";

export const metadata: Metadata = {
  title: "Mes cours",
};

export default async function CoursPage() {
  const { supabase, userId } = await requireTeacher();

  const { data: rows } = await supabase
    .from("courses")
    .select("id, title, field, description, created_at")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });

  const courses = rows ?? [];

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
            Créez vos cours, puis ouvrez-en un pour y ajouter des devoirs.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Liste des cours */}
            <div className="order-2 lg:order-1">
              {courses.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun cours pour le moment. Créez votre premier cours →
                </p>
              ) : (
                <ul className="space-y-4">
                  {courses.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/espace/cours/${c.id}`}
                        className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-bold text-ipmd-black">
                            {c.title}
                          </h3>
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
                          Gérer les devoirs →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaire de création */}
            <div className="order-1 lg:order-2">
              <NewCourseForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
