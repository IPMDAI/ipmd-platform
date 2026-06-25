import fs from "node:fs";
import path from "node:path";
import { Section } from "@/components/ui/Section";

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

  const [featured, ...rest] = media;

  return (
    <Section variant="white">
      {/* Média principal en grand */}
      <div className="overflow-hidden rounded-3xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
        {featured.type === "video" ? (
          <video
            src={featured.src}
            controls
            preload="metadata"
            playsInline
            className="aspect-video h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={featured.src} alt="" className="h-auto w-full" />
        )}
      </div>

      {/* Médias suivants en grille */}
      {rest.length > 0 && (
        <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`}>
          {rest.map((m) => (
            <div key={m.src} className="overflow-hidden rounded-2xl bg-ipmd-black shadow ring-1 ring-black/5">
              {m.type === "video" ? (
                <video
                  src={m.src}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.src} alt="" className="aspect-video h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
