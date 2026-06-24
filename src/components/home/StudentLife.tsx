import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Galerie « La vie à l'IPMD » — photos réelles des étudiants.
 *
 * 👉 Pour ajouter des photos : déposez simplement vos images (jpg/png/webp)
 *    dans le dossier `public/galerie/`. Elles apparaissent automatiquement,
 *    triées par nom de fichier. Aucun code à modifier.
 *
 * Si le dossier est vide ou absent, la section ne s'affiche pas.
 */
function getGalleryImages(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "galerie");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/galerie/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export function StudentLife() {
  const images = getGalleryImages();
  if (images.length === 0) return null;

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
    </Section>
  );
}
