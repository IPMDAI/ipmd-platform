import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { AdmissionWizard } from "@/components/wizard/AdmissionWizard";
import { loadWizardCatalog } from "@/lib/wizard-catalog";

export const metadata: Metadata = {
  title: "Admission — nouveau parcours (aperçu)",
  description:
    "Nouveau parcours de candidature IPMD, étape par étape. Aperçu en cours de validation.",
  // Aperçu interne : non indexé tant que le wizard n'est pas validé.
  robots: { index: false, follow: false },
};

/**
 * Route ISOLÉE du nouveau wizard d'admission (étapes 0→5).
 *
 * ⚠️ Ne remplace pas /admission : le formulaire public actuel reste la voie de
 * candidature en production. Cette page sert à construire et valider le wizard
 * étape par étape. L'Étape 3 (Projet) consomme le catalogue réel chargé côté
 * serveur (`loadWizardCatalog`) — 100 % data-driven, rien codé en dur.
 */
export default async function AdmissionWizardPage() {
  const catalog = await loadWizardCatalog();
  return (
    <>
      <PageHero
        eyebrow="Admission · Aperçu"
        title="Votre candidature, étape par étape"
        description="Un nouveau parcours guidé pour déposer votre demande. Commencez par choisir votre univers de formation."
      />
      <Section variant="white">
        <AdmissionWizard catalog={catalog} />
      </Section>
    </>
  );
}
