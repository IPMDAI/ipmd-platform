import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

interface AboutSectionProps {
  /** Affiche le sur-titre « À propos » et le grand titre. */
  showHeading?: boolean;
  variant?: "light" | "white";
}

/** Section « À propos de l'IPMD » : texte présenté à côté d'une image. */
export function AboutSection({
  showHeading = true,
  variant = "white",
}: AboutSectionProps = {}) {
  return (
    <Section variant={variant}>
      <div className="grid items-start gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
        {/* Texte */}
        <div>
          {showHeading && (
            <>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-ipmd-red">
                À propos
              </p>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-ipmd-black sm:text-4xl">
                L&apos;Institut Polytechnique des Métiers du Digital
              </h2>
            </>
          )}

          <div
            className={`${
              showHeading ? "mt-6" : ""
            } space-y-4 text-[15px] leading-relaxed text-black/70`}
          >
            <p>
              L&apos;Institut Polytechnique des Métiers du Digital, en abrégé{" "}
              <strong className="font-semibold text-ipmd-black">IPMD</strong>,
              est un établissement privé d&apos;enseignement supérieur spécialisé
              dans la formation aux métiers du digital, de l&apos;informatique, de
              l&apos;intelligence artificielle, du management, de l&apos;innovation
              et de la gouvernance numérique.
            </p>
            <p>
              Ses formations sont sanctionnées par des diplômes de{" "}
              <strong className="font-semibold text-ipmd-black">Licence</strong>{" "}
              et de{" "}
              <strong className="font-semibold text-ipmd-black">Master</strong>,
              ainsi que par des diplômes internationaux tels que le{" "}
              <strong className="font-semibold text-ipmd-black">Bachelor</strong>,
              le{" "}
              <strong className="font-semibold text-ipmd-black">
                Master international
              </strong>
              , l&apos;
              <strong className="font-semibold text-ipmd-black">
                Executive Master
              </strong>
              , le{" "}
              <strong className="font-semibold text-ipmd-black">MBA</strong>,
              l&apos;
              <strong className="font-semibold text-ipmd-black">
                Executive MBA
              </strong>{" "}
              et le{" "}
              <strong className="font-semibold text-ipmd-black">DBA</strong>. À
              IPMD, les cours se déroulent en{" "}
              <strong className="font-semibold text-ipmd-black">
                présentiel, à distance et en hybride
              </strong>
              .
            </p>
            <p>
              Basé au cœur d&apos;
              <strong className="font-semibold text-ipmd-black">
                Abidjan, en Côte d&apos;Ivoire, depuis 2019
              </strong>
              , l&apos;IPMD accompagne les étudiants, les professionnels, les
              dirigeants et les personnes en reconversion dans l&apos;acquisition
              de compétences pratiques, modernes et adaptées aux besoins actuels
              du marché de l&apos;emploi.
            </p>
            <p>
              Notre mission est de former une nouvelle génération de talents
              capables de répondre aux défis de la transformation digitale, de
              l&apos;entrepreneuriat, du développement technologique, de la
              gouvernance numérique et de l&apos;intelligence artificielle.
            </p>
            <p>
              À travers des formations initiales et continues, l&apos;IPMD propose
              des programmes orientés à{" "}
              <strong className="font-semibold text-ipmd-black">
                80 % vers la pratique
              </strong>
              , l&apos;innovation et l&apos;insertion professionnelle dans les
              domaines du digital, de l&apos;intelligence artificielle et du
              management.
            </p>
            <p>
              L&apos;IPMD met l&apos;accent sur la pratique, la qualité de
              l&apos;enseignement, l&apos;encadrement des apprenants, la
              professionnalisation des formations et le développement de
              partenariats avec les entreprises afin de faciliter les stages,
              l&apos;emploi, l&apos;entrepreneuriat ainsi que la mise en relation
              au niveau national et international.
            </p>
            <p>
              En complément de ses formations diplômantes, l&apos;IPMD propose
              également des{" "}
              <strong className="font-semibold text-ipmd-black">
                bootcamps intensifs
              </strong>{" "}
              sanctionnés par des certificats, destinés aux étudiants,
              professionnels, dirigeants, entrepreneurs et personnes souhaitant
              acquérir rapidement des compétences pratiques dans les métiers du
              digital et de l&apos;intelligence artificielle.
            </p>
            <p>
              Notre ambition est de devenir une référence dans la formation aux
              métiers du digital, de l&apos;intelligence artificielle et de la
              gouvernance numérique, en préparant nos apprenants à réussir dans un
              monde de plus en plus connecté, digitalisé, automatisé et
              compétitif.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/formations">Découvrir nos formations</Button>
            <Button href="/admission" variant="outline">
              Demander une admission
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="lg:sticky lg:top-28">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80&auto=format&fit=crop"
              alt="Étudiants IPMD en collaboration sur des projets digitaux"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-ipmd-black/80 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-white">
                Abidjan, Côte d&apos;Ivoire
              </p>
              <p className="mt-0.5 text-xs text-white/70">
                Au service des talents du digital depuis 2019
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
