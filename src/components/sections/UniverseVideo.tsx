import fs from "node:fs";
import path from "node:path";
import { Section } from "@/components/ui/Section";

/**
 * Grande vidéo en haut d'une page d'univers (sous le hero).
 *
 * 👉 Déposez la/les vidéo(s) dans `public/videos-<universeId>/` :
 *    - campus         → public/videos-campus/
 *    - professionnel  → public/videos-professionnel/   (IPMD Pro)
 *    - gouvernance    → public/videos-gouvernance/      (IPMD Executive)
 *    - ultrajobs      → public/videos-ultrajobs/
 *    - ultraboost     → public/videos-ultraboost/
 *    - ultraexecutive → public/videos-ultraexecutive/
 *
 * La 1re vidéo (par nom) s'affiche en grand ; les suivantes en grille.
 * Lecture au clic (preload="metadata"). Masqué si le dossier est vide.
 */
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;

function getVideos(dir: string): string[] {
  try {
    const full = path.join(process.cwd(), "public", dir);
    return fs
      .readdirSync(full)
      .filter((f) => VIDEO_RE.test(f))
      .sort()
      .map((f) => `/${dir}/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export function UniverseVideo({ universeId }: { universeId: string }) {
  const videos = getVideos(`videos-${universeId}`);
  if (videos.length === 0) return null;

  const [featured, ...rest] = videos;

  return (
    <Section variant="white">
      <div className="overflow-hidden rounded-3xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
        <video
          src={featured}
          controls
          preload="metadata"
          playsInline
          className="aspect-video h-full w-full object-cover"
        />
      </div>

      {rest.length > 0 && (
        <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`}>
          {rest.map((src) => (
            <div key={src} className="overflow-hidden rounded-2xl bg-ipmd-black shadow ring-1 ring-black/5">
              <video
                src={src}
                controls
                preload="metadata"
                playsInline
                className="aspect-video h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
