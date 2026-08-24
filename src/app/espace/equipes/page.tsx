import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { loadEquipesAdmin } from "@/lib/teams-data";
import { TeamsAdmin } from "@/components/espace/TeamsAdmin";

export const metadata: Metadata = {
  title: "Équipes & Accès",
};

/** Administration des Équipes & Accès par univers — RÉSERVÉ super_admin. */
export default async function EquipesPage() {
  const { role } = await requireAdmin();
  if (role !== "super_admin") redirect("/espace");

  const data = await loadEquipesAdmin();

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Équipes &amp; Accès par univers
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Gérez les équipes, leurs membres, leur responsable et leurs permissions — cloisonnées
            par univers. Le <strong>super_admin</strong> conserve la vision globale.
          </p>
          <div className="mt-8">
            {data ? (
              <TeamsAdmin data={data} />
            ) : (
              <p className="rounded-xl bg-white p-6 text-sm text-black/55 ring-1 ring-black/5">
                Données indisponibles.
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
