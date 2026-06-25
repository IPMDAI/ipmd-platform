import fs from "node:fs";
import path from "node:path";
import { Section } from "@/components/ui/Section";
import { UniverseMediaCarousel, type CarouselMedia } from "@/components/sections/UniverseMediaCarousel";

/**
 * Grand carrousel (images/vidéos) placé juste avant la section « Un tuteur IA ».
 *
 * 👉 Déposez vos images dans `public/carousel-ia/` (3 images conseillées).
 *    Elles défilent automatiquement (2 s), triées par nom de fichier.
 *    Nommez-les 1-..., 2-..., 3-... pour contrôler l'ordre.
 *    Section masquée si le dossier est vide.
 */
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
const MEDIA_RE = /\.(jpe?g|png|webp|avif|mp4|webm|mov|m4v)$/i;

function getMedia(dir: string): CarouselMedia[] {
  try {
    const full = path.join(process.cwd(), "public", dir);
    return fs
      .readdirSync(full)
      .filter((f) => MEDIA_RE.test(f))
      .sort()
      .map((f) => ({
        src: `/${dir}/${encodeURIComponent(f)}`,
        type: VIDEO_RE.test(f) ? ("video" as const) : ("image" as const),
      }));
  } catch {
    return [];
  }
}

export function AiCarousel() {
  const media = getMedia("carousel-ia");
  if (media.length === 0) return null;

  return (
    <Section variant="light">
      <UniverseMediaCarousel media={media} />
    </Section>
  );
}
