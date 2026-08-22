import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { AdmissionWizard } from "@/components/wizard/AdmissionWizard";
import { loadWizardCatalog } from "@/lib/wizard-catalog";

export const metadata: Metadata = {
  title: "Admission / Inscription",
  description:
    "Déposez votre demande d'admission à l'IPMD, étape par étape : parcours, identité, projet et pièces justificatives.",
};

/**
 * Page publique d'admission — nouveau parcours guidé (wizard 0→5).
 *
 * L'ancien formulaire reste disponible sur /admission/legacy pendant la période
 * de bascule. Le wizard consomme le catalogue réel (`loadWizardCatalog`) —
 * 100 % data-driven.
 */
export default async function AdmissionPage() {
  const catalog = await loadWizardCatalog();
  return (
    <>
      <PageHero
        eyebrow="Admission"
        title="Votre candidature, étape par étape"
        description="Rejoignez l'IPMD via un parcours guidé. Choisissez votre univers de formation, renseignez votre dossier et déposez vos pièces en quelques minutes."
      />
      <Section variant="white">
        <AdmissionWizard catalog={catalog} />
      </Section>
    </>
  );
}
