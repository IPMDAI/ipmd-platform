import type { Metadata } from "next";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { HostCompanyForm } from "@/components/espace/stages/HostCompanyForm";
import { HostCompanyCard, type HostCompany } from "@/components/espace/stages/HostCompanyCard";

export const metadata: Metadata = { title: "Entreprises d'accueil" };

/**
 * Espace Directeur des Études — « Entreprises d'accueil » (D8-UI-1).
 * Fiche OPÉRATIONNELLE de stage. ⚠️ Ce n'est PAS un partenaire officiel IPMD
 * (décision institutionnelle de l'AG). Une entreprise archivée reste liée aux
 * stages existants mais n'est plus proposée pour de nouveaux stages (garde DB).
 */
export default async function EntreprisesPage() {
  const { supabase } = await requireAcademic();

  const { data: rows } = await supabase
    .from("host_companies")
    .select("id, name, sector, city, country, website, status")
    .order("status", { ascending: true })
    .order("name", { ascending: true });
  const companies = (rows ?? []) as HostCompany[];
  const actives = companies.filter((c) => c.status !== "archive");
  const archived = companies.filter((c) => c.status === "archive");

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Entreprises d&apos;accueil
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Fiches opérationnelles pour les stages.{" "}
            <strong className="text-ipmd-black">
              Une entreprise d&apos;accueil n&apos;est pas un partenaire officiel IPMD
            </strong>{" "}
            : les partenariats institutionnels relèvent d&apos;une décision de
            l&apos;Administrateur Général.
          </p>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold text-ipmd-black">Nouvelle entreprise</h2>
            <p className="mt-0.5 mb-3 text-xs text-black/50">
              Créée « active » : immédiatement sélectionnable pour un stage.
            </p>
            <HostCompanyForm />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-ipmd-black">
              Actives <span className="text-black/40">({actives.length})</span>
            </h2>
            {actives.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucune entreprise active.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {actives.map((c) => (
                  <HostCompanyCard key={c.id} company={c} />
                ))}
              </ul>
            )}
          </div>

          {archived.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ipmd-black">
                Archivées <span className="text-black/40">({archived.length})</span>
              </h2>
              <ul className="mt-3 space-y-3">
                {archived.map((c) => (
                  <HostCompanyCard key={c.id} company={c} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
