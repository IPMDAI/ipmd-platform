import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Planning",
};

export default async function PlanningPage() {
  const { supabase } = await requireAdmin();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level, academic_year")
    .order("name");

  const classList = classes ?? [];

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
            Planning des classes
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Choisissez une classe pour construire son emploi du temps.
          </p>

          {classList.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune classe. Créez-en dans{" "}
              <Link href="/espace/classes" className="font-semibold text-ipmd-red">
                Classes &amp; filières
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {classList.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/espace/planning/${c.id}`}
                    className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                  >
                    <h2 className="text-base font-bold text-ipmd-black">
                      {c.name}
                    </h2>
                    <p className="text-xs text-black/50">
                      {[c.level, c.academic_year].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                    <span className="mt-2 inline-block text-xs font-semibold text-ipmd-red">
                      Construire le planning →
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
