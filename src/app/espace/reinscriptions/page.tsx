import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { loadReenrollmentPreview } from "@/lib/reenrollment-preview";
import { ReenrollmentPreview } from "@/components/espace/ReenrollmentPreview";

export const metadata: Metadata = {
  title: "Réinscriptions 2026-2027",
};

/**
 * Écran admin « Réinscriptions 2026-2027 » — MODE PREVIEW.
 * Lecture seule : liste la cohorte 2025-2026, le passage proposé, les statuts et
 * les conditions financières. Aucune écriture (la préparation en lot n'est pas
 * encore branchée). `loadReenrollmentPreview` appelle `requireAdmin` (accès
 * réservé admin/super_admin).
 */
export default async function ReinscriptionsPage() {
  const preview = await loadReenrollmentPreview();

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-black text-ipmd-black sm:text-3xl">Réinscriptions 2026-2027</h1>
          <p className="mt-2 text-sm text-black/55">
            Aperçu de la cohorte 2025-2026 et du passage proposé pour 2026-2027. Sélectionnez les
            étudiants éligibles à préparer en lot. <strong>Aucune écriture</strong> n'est effectuée
            depuis cet écran pour l'instant.
          </p>
          <div className="mt-8">
            <ReenrollmentPreview preview={preview} />
          </div>
        </div>
      </Container>
    </section>
  );
}
