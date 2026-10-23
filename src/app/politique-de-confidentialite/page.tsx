import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/sections/PageHero";

export const metadata: Metadata = {
  title: "Politique de confidentialité – IPMD",
  description:
    "Politique de confidentialité d'IPMD (Institut Polytechnique des Métiers du Digital) : données collectées, finalités, partage, conservation, sécurité et droits sur vos données.",
  alternates: { canonical: "/politique-de-confidentialite" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Politique de confidentialité – IPMD",
    description:
      "Comment IPMD collecte, utilise et protège les données transmises via ses formulaires d'admission et de demande de renseignements.",
    url: "/politique-de-confidentialite",
    type: "website",
  },
};

/** Petit bloc de section : titre + contenu, pour une lecture claire. */
function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-black/70">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((it) => (
        <li key={it} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ipmd-red" aria-hidden />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <PageHero
        eyebrow="🔒 Confidentialité"
        title="Politique de confidentialité"
        description="Comment l'IPMD collecte, utilise et protège les données que vous nous transmettez, notamment via nos formulaires d'admission et de demande de renseignements."
      />

      <Section variant="white" className="!py-12 sm:!py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-black/40">
            Dernière mise à jour : octobre 2026
          </p>

          <div className="mt-8">
            <Article title="Préambule">
              <p>
                L&apos;Institut Polytechnique des Métiers du Digital (IPMD) attache de
                l&apos;importance à la protection de vos données personnelles. Cette politique
                explique quelles données nous pouvons collecter, pourquoi, et comment elles sont
                utilisées et protégées, en particulier lorsque vous remplissez un formulaire de
                candidature, une demande de renseignements ou un formulaire publié sur une
                plateforme tierce (par exemple Meta / Facebook).
              </p>
            </Article>

            <Article title="Données que nous pouvons collecter">
              <p>Selon votre démarche, les données transmises à l&apos;IPMD peuvent notamment comprendre :</p>
              <Bullets
                items={[
                  "Nom et prénom(s) ;",
                  "Adresse e-mail ;",
                  "Numéro de téléphone ;",
                  "Niveau d'études ;",
                  "Diplôme / formation souhaité(e) ;",
                  "Mode de formation souhaité ;",
                  "Informations transmises dans une candidature ou une demande de renseignements.",
                ]}
              />
            </Article>

            <Article title="Finalités : pourquoi nous utilisons vos données">
              <p>Vos données sont utilisées notamment pour :</p>
              <Bullets
                items={[
                  "Étudier les demandes d'admission ;",
                  "Contacter les candidats et prospects ;",
                  "Orienter les candidats vers une formation adaptée ;",
                  "Assurer le suivi administratif d'une candidature ou d'une inscription ;",
                  "Transmettre les informations relatives aux formations, aux rentrées et aux admissions.",
                ]}
              />
            </Article>

            <Article title="Partage des données">
              <p>
                Vos données ne sont pas vendues à des tiers. Elles ne sont accessibles qu&apos;aux
                personnes et services autorisés de l&apos;IPMD et, lorsque cela est nécessaire au
                fonctionnement du service, aux prestataires techniques utilisés par l&apos;IPMD (par
                exemple pour l&apos;hébergement du site ou l&apos;envoi d&apos;e-mails). Ces
                prestataires n&apos;utilisent vos données que pour fournir le service demandé.
              </p>
            </Article>

            <Article title="Conservation des données">
              <p>
                Vos données sont conservées le temps nécessaire aux finalités décrites ci-dessus
                (traitement de votre demande, suivi administratif, communication sur nos formations),
                puis supprimées ou archivées lorsqu&apos;elles ne sont plus nécessaires. Pour toute
                question concernant la conservation de vos données, vous pouvez nous contacter à
                l&apos;adresse indiquée plus bas.
              </p>
            </Article>

            <Article title="Sécurité">
              <p>
                L&apos;IPMD met en œuvre des mesures raisonnables destinées à protéger vos données
                contre l&apos;accès non autorisé, la perte, l&apos;altération ou la divulgation,
                notamment en limitant l&apos;accès aux seules personnes autorisées dans le cadre de
                leurs fonctions.
              </p>
            </Article>

            <Article title="Vos droits sur vos données">
              <p>Dans le cadre du traitement de vos données, vous pouvez notamment :</p>
              <Bullets
                items={[
                  "Consulter les données que nous détenons vous concernant ;",
                  "Demander leur rectification lorsqu'elles sont inexactes ou incomplètes ;",
                  "Demander leur suppression ;",
                  "Vous opposer à certains usages ou retirer votre consentement.",
                ]}
              />
              <p>
                Pour exercer ces droits, il vous suffit de nous contacter à l&apos;adresse indiquée
                dans la section « Contact » ci-dessous.
              </p>
            </Article>

            <Article title="Demandes de modification ou de suppression">
              <p>
                Vous pouvez à tout moment demander la modification ou la suppression de vos données
                en écrivant à l&apos;adresse{" "}
                <a href="mailto:professionnel@ipmd.pro" className="font-semibold text-ipmd-red hover:underline">
                  professionnel@ipmd.pro
                </a>
                . Nous donnons suite à votre demande dans un délai raisonnable.
              </p>
            </Article>

            <Article title="Utilisation éventuelle de services tiers">
              <p>
                Nos formulaires et notre site peuvent s&apos;appuyer sur des services tiers, par
                exemple des plateformes publicitaires ou de réseaux sociaux (comme Meta / Facebook)
                lorsque vous remplissez un formulaire qui y est hébergé, ainsi que des prestataires
                d&apos;hébergement et d&apos;envoi d&apos;e-mails. Ces services disposent de leurs
                propres politiques de confidentialité, que nous vous invitons à consulter.
              </p>
            </Article>

            <Article title="Mise à jour de la politique">
              <p>
                Cette politique de confidentialité peut être mise à jour afin de refléter
                l&apos;évolution de nos services ou de nos pratiques. La version en vigueur est celle
                publiée sur cette page ; nous vous invitons à la consulter régulièrement.
              </p>
            </Article>

            <Article title="Contact">
              <div className="rounded-2xl bg-ipmd-light p-5 text-[15px] text-black/75 ring-1 ring-black/5">
                <p className="font-bold text-ipmd-black">
                  IPMD – Institut Polytechnique des Métiers du Digital
                </p>
                <p className="mt-1">Abidjan, Cocody – Côte d&apos;Ivoire</p>
                <p className="mt-1">
                  E-mail :{" "}
                  <a href="mailto:professionnel@ipmd.pro" className="font-semibold text-ipmd-red hover:underline">
                    professionnel@ipmd.pro
                  </a>
                </p>
                <p className="mt-1">
                  Site :{" "}
                  <a
                    href="https://www.ipmd.pro"
                    className="font-semibold text-ipmd-red hover:underline"
                    rel="noopener noreferrer"
                  >
                    www.ipmd.pro
                  </a>
                </p>
              </div>
            </Article>
          </div>
        </div>
      </Section>
    </>
  );
}
