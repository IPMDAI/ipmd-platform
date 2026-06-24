import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { ReturningStudentForm } from "@/components/espace/ReturningStudentForm";
import { CreateUserForm } from "@/components/espace/CreateUserForm";
import { DEFAULT_LEVELS } from "@/lib/finance";

export const metadata: Metadata = { title: "Reprise des anciens" };

export default async function ReprisePage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (me?.role !== "super_admin") redirect("/espace");

  const [{ data: classRows }, { data: levelRows }, { data: settings }] = await Promise.all([
    supabase.from("classes").select("id, name, intake, tuition_amount").order("name"),
    supabase.from("tuition_levels").select("level, amount").order("sort_order"),
    supabase.from("finance_settings").select("registration_fee").eq("id", 1).maybeSingle(),
  ]);
  const classes = (classRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    intake: c.intake,
    tuition: c.tuition_amount != null ? Number(c.tuition_amount) : null,
  }));
  const levels = (levelRows ?? []).map((l) => l.level as string);
  const levelTuition: Record<string, number> = Object.fromEntries(
    (levelRows ?? []).map((l) => [l.level as string, Number(l.amount ?? 0)])
  );
  const registrationFee = Number(settings?.registration_fee ?? 300000);

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Reprise des anciens
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-black/55">
            Pour intégrer les étudiants et enseignants déjà existants (sans compte, parfois non
            soldés). Chaque création envoie un lien « définir mot de passe ».
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ReturningStudentForm
              classes={classes}
              levels={levels.length ? levels : DEFAULT_LEVELS}
              levelTuition={levelTuition}
              registrationFee={registrationFee}
            />

            <div className="space-y-4">
              <CreateUserForm />
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 ring-1 ring-amber-200">
                <p className="font-bold">👨‍🏫 Création d&apos;un enseignant</p>
                <p className="mt-1">
                  Utilise le formulaire ci-dessus avec le rôle <strong>Enseignant</strong> (un mot de
                  passe provisoire est défini, à lui communiquer).
                </p>
                <p className="mt-2 font-semibold">
                  Après création du compte enseignant, complétez sa fiche dans le module{" "}
                  <Link href="/espace/enseignants" className="underline">Enseignants</Link> :
                  fonction, matières, classes, taux et statut.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
