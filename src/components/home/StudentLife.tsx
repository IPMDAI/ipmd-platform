import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGalleryImages } from "@/lib/gallery";

/**
 * Galerie « La vie à l'IPMD » sur l'accueil — aperçu des meilleures photos.
 * On n'affiche qu'un échantillon (HOME_MAX) pour garder l'accueil léger ;
 * la galerie complète est sur la page /galerie.
 *
 * 👉 Pour ajouter des photos : déposez vos images dans `public/galerie/`.
 */
const HOME_MAX = 8;

export function StudentLife() {
  const all = getGalleryImages("galerie");
  if (all.length === 0) return null;
  const images = all.slice(0, HOME_MAX);

  return (
    <Section variant="white">
      <SectionHeading
        eyebrow="La vie à l'IPMD"
        title="Nos étudiants en formation"
        description="Formations diplômantes aux métiers du digital et de l'intelligence artificielle — 80 % de pratique, sur le campus d'Abidjan."
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-ipmd-light ring-1 ring-black/5"
          >
            <Image
              src={src}
              alt="Étudiants de l'IPMD en formation"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={i < 4}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/galerie"
          className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ipmd-red"
        >
          Voir toute la galerie
          <span aria-hidden>→</span>
        </Link>
      </div>
    </Section>
  );
}
