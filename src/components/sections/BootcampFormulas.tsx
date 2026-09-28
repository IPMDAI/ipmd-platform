import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { BOOTCAMP_FORMULAS, BOOTCAMP_INTAKE } from "@/data/bootcamp-formulas";

/**
 * Grille des 5 formules & tarifs des bootcamps certifiants — réutilisée par
 * UltraJobs, UltraBoost et SeniorsHub (chacun dans son espace). Le lien
 * d'admission cible l'univers courant.
 */
export function BootcampFormulas({ universeId }: { universeId: string }) {
  return (
    <Section variant="light">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Choisissez la formule adaptée à votre ambition
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-black/55">
          Bootcamps certifiants, <strong>+80 % de pratique</strong>, orientés métiers d&apos;avenir.
        </p>
        <p className="mt-4 inline-block rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold text-white shadow-sm">
          📅 Prochaine rentrée : {BOOTCAMP_INTAKE}
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BOOTCAMP_FORMULAS.map((f) => (
          <div
            key={f.id}
            className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
          >
            <span className="inline-flex w-fit rounded-full bg-ipmd-light px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ipmd-black ring-1 ring-black/10">
              {f.duration}
            </span>
            <h3 className="mt-3 text-lg font-bold text-ipmd-black">{f.title}</h3>

            <div className="mt-3">
              {f.pricePrefix && (
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/45">
                  {f.pricePrefix}
                </span>
              )}
              <span className="text-2xl font-extrabold text-ipmd-red">{f.price}</span>
              <span className="ml-1 text-xs text-black/45">coût de la formation</span>
            </div>

            <ul className="mt-4 space-y-2 text-[13px] text-black/70">
              <li className="flex gap-2">
                <span aria-hidden>🧾</span>
                <span>Frais d&apos;inscription : <strong>{f.registration}</strong></span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🎓</span>
                <span>{f.certification}</span>
              </li>
              {f.installments && (
                <li className="flex gap-2">
                  <span aria-hidden>💳</span>
                  <span>{f.installments}</span>
                </li>
              )}
            </ul>

            <div className="mt-6 pt-2">
              <Button href={`/admission?u=${universeId}`} className="w-full justify-center">
                Demander une admission
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-black/50">
        ⚠️ Les frais d&apos;inscription ne sont pas inclus dans le coût de la formation ou du bootcamp choisi.
      </p>
    </Section>
  );
}
