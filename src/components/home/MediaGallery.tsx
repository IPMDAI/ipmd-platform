import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Galerie média réutilisable (photos + vidéos mélangées), auto-alimentée.
 *
 * 👉 Déposez photos (jpg/png/webp) et vidéos (mp4/webm/mov) dans le dossier
 *    `public/<dir>/`. Tout apparaît automatiquement, trié par nom.
 *    Vidéos en lecture au clic (preload="metadata") → page rapide.
 *    Section masquée si le dossier est vide ou absent.
 */
type Media = { src: string; type: "image" | "video" };

const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
const MEDIA_RE = /\.(jpe?g|png|webp|avif|mp4|webm|mov|m4v)$/i;

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

interface MediaGalleryProps {
  /** Sous-dossier de public/ (ex. "galerie-reconversion"). */
  dir: string;
  eyebrow: string;
  title: string;
  description?: string;
  variant?: "light" | "white";
}

export function MediaGallery({ dir, eyebrow, title, description, variant = "white" }: MediaGalleryProps) {
  const media = getMedia(dir);
  if (media.length === 0) return null;

  return (
    <Section variant={variant}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {media.map((m, i) => (
          <div
            key={m.src}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-ipmd-light ring-1 ring-black/5"
          >
            {m.type === "image" ? (
              <Image
                src={m.src}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={i < 4}
              />
            ) : (
              <video
                src={m.src}
                controls
                preload="metadata"
                playsInline
                className="absolute inset-0 h-full w-full bg-ipmd-black object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
