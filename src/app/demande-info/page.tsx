import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { DemandeInfoForm } from "@/components/forms/DemandeInfoForm";

export const metadata: Metadata = {
  title: "Demande d'information — IPMD",
  description:
    "Vous souhaitez des informations sur nos formations (Licence, Master, Bootcamps) ? Laissez-nous vos coordonnées, l'équipe des admissions vous recontacte.",
};

export default function DemandeInfoPage() {
  return (
    <section className="bg-ipmd-light py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ipmd-red">Admissions</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ipmd-black sm:text-4xl">
            Demande d&apos;information
          </h1>
          <p className="mt-3 text-base text-black/60">
            Une question sur un programme, les frais, les cours du soir ou une réorientation ?
            Laissez-nous vos coordonnées : l&apos;équipe des admissions vous recontacte rapidement.
          </p>
          <div className="mt-8">
            <DemandeInfoForm />
          </div>
          <p className="mt-6 text-center text-sm text-black/50">
            Ou écrivez-nous sur WhatsApp : <strong>+225 07 75 75 88 88</strong> · admission@ipmd.pro
          </p>
        </div>
      </Container>
    </section>
  );
}
