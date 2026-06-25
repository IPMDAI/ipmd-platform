import fs from "node:fs";
import path from "node:path";
import { Section } from "@/components/ui/Section";
import { UniverseMediaCarousel } from "@/components/sections/UniverseMediaCarousel";

/**
 * Grand média (vidéo OU image) en haut d'une page d'univers (sous le hero).
 *
 * 👉 Déposez vos fichiers dans `public/videos-<universeId>/` :
 *    - campus         → public/videos-campus/
 *    - professionnel  → public/videos-professionnel/   (IPMD Pro)
 *    - gouvernance    → public/videos-gouvernance/      (IPMD Executive)
 *    - ultrajobs      → public/videos-ultrajobs/
 *    - ultraboost     → public/videos-ultraboost/
 *    - ultraexecutive → public/videos-ultraexecutive/
 *
 * Vidéos (mp4/webm/mov) ET images (jpg/png/webp) acceptées.
 * Le 1er fichier (par nom) s'affiche en grand ; les suivants en grille.
 * Masqué si le dossier est vide.
 */
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
const MEDIA_RE = /\.(jpe?g|png|webp|avif|mp4|webm|mov|m4v)$/i;

type Media = { src: string; type: "image" | "video" };

function getMedia(dir: string): Media[] {
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

export function UniverseVideo({ universeId }: { universeId: string }) {
  const media = getMedia(`videos-${universeId}`);
  if (media.length === 0) return null;

  return (
    <Section variant="white">
      <UniverseMediaCarousel media={media} />
    </Section>
  );
}
