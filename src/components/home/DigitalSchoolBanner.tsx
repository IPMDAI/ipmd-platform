import { Section } from "@/components/ui/Section";

/** Bandeau sombre « Une école digitale et augmentée par l'IA ». */
export function DigitalSchoolBanner() {
  return (
    <Section variant="dark" contained>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Une école <span className="text-ipmd-red-light">digitale</span> et{" "}
          <span className="text-ipmd-red-light">augmentée par l&apos;IA</span>
        </h2>
        <p className="mt-5 text-lg text-white/70">
          De la formation initiale à la gouvernance, IPMD accompagne chaque
          profil — étudiants, professionnels, parents, enseignants, dirigeants
          et administration — avec une pédagogie moderne et une intelligence
          artificielle éducative.
        </p>
      </div>
    </Section>
  );
}
