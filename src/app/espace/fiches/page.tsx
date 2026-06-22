import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { FichesList, type FicheRow } from "@/components/espace/FichesList";

export const metadata: Metadata = {
  title: "Fiches pédagogiques",
};

export default async function FichesPage() {
  const { supabase } = await requireAdmin();

  const [{ data: lessons }, { data: courses }, { data: att }] = await Promise.all([
    supabase
      .from("course_lessons")
      .select("id, course_id, lesson_date, theme, resources")
      .order("lesson_date", { ascending: false }),
    supabase.from("courses").select("id, title"),
    supabase.from("attendance").select("lesson_id, present"),
  ]);

  const courseTitle = new Map((courses ?? []).map((c) => [c.id, c.title]));

  // Présence par séance.
  const stats = new Map<string, { present: number; total: number }>();
  for (const a of att ?? []) {
    const s = stats.get(a.lesson_id) ?? { present: 0, total: 0 };
    s.total += 1;
    if (a.present) s.present += 1;
    stats.set(a.lesson_id, s);
  }

  const fiches: FicheRow[] = (lessons ?? []).map((l) => {
    const s = stats.get(l.id) ?? { present: 0, total: 0 };
    return {
      id: l.id,
      course: courseTitle.get(l.course_id) ?? "Cours",
      date: l.lesson_date,
      theme: l.theme,
      resources: l.resources,
      present: s.present,
      total: s.total,
    };
  });

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Fiches pédagogiques
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Séances réalisées : thème, ressources distribuées et assiduité.
          </p>

          <div className="mt-8">
            {fiches.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucune séance enregistrée. Les enseignants créent les fiches
                depuis leurs cours.
              </p>
            ) : (
              <FichesList fiches={fiches} />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
