import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/referentiel";
import { PlanningClassPicker } from "@/components/espace/PlanningClassPicker";

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
            <PlanningClassPicker
              classes={classList}
              defaultYear={CURRENT_ACADEMIC_YEAR}
            />
          )}
        </div>
      </Container>
    </section>
  );
}
