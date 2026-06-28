import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Button } from "@/components/ui/Button";
import { UpcomingBootcamps } from "@/components/ultraboost/UpcomingBootcamps";
import { getHub } from "@/data/ecosystem";
import { getGalleryImages } from "@/lib/gallery";

/** Page d'un pôle de l'écosystème IPMD (SeniorsHub, Hub, Skills, Entreprise). */
export function HubShowcase({ hubId }: { hubId: string }) {
  const hub = getHub(hubId);
  if (!hub) return null;

  // Photos optionnelles : public/galerie-<hubId>/ (ex. galerie-seniorshub).
  const photos = getGalleryImages(`galerie-${hubId}`);

  return (
    <>
      <PageHero
        eyebrow={`${hub.icon} ${hub.eyebrow}`}
        title={hub.name}
        description={hub.description}
      >
        {hub.badge && (
          <span className="mb-4 inline-block rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
            {hub.badge}
          </span>
        )}
        <div className="mt-2">
          <Button href={hub.cta.href}>{hub.cta.label}</Button>
        </div>
      </PageHero>

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Ce que propose {hub.name}
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">{hub.tagline}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hub.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 40}>
              <div className="flex h-full flex-col rounded-2xl border border-black/5 bg-ipmd-light p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  {hub.icon}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ipmd-black">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-black/60">{item.description}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {photos.length > 0 && (
        <Section variant="light">
          <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
            {hub.name} en images
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {photos.map((src, i) => (
              <div
                key={src}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
              >
                <Image
                  src={src}
                  alt={`${hub.name} — en images`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={i < 4}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      <UpcomingBootcamps universeId={hubId} />

      <CtaBanner
        title={`Intéressé par ${hub.name} ?`}
        description="Notre équipe vous accompagne et répond à toutes vos questions."
        primary={{ label: hub.cta.label, href: hub.cta.href }}
      />
    </>
  );
}
