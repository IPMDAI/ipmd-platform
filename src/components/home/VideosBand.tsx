import fs from "node:fs";
import path from "node:path";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section vidéos « IPMD en mouvement ».
 *
 * 👉 Pour ajouter des vidéos : déposez vos fichiers (.mp4 / .webm / .mov)
 *    dans le dossier `public/videos/`. La mise en page s'adapte au nombre :
 *    1 = grande pleine largeur, 2 = côte à côte, 3+ = grille.
 *
 * Les vidéos ne se chargent qu'au clic (preload="metadata") → page rapide.
 * Si le dossier est vide ou absent, la section ne s'affiche pas.
 */
function getVideos(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "videos");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f))
      .sort()
      .map((f) => `/videos/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export function VideosBand() {
  const videos = getVideos();
  if (videos.length === 0) return null;

  // 1re vidéo (par nom) = grande, pleine largeur ; les suivantes en grille.
  const [featured, ...rest] = videos;

  return (
    <Section variant="light">
      <SectionHeading
        eyebrow="IPMD en vidéo"
        title="L'IPMD en mouvement"
        description="Cours, projets, vie de campus : découvrez l'ambiance et la pédagogie 80 % pratique de l'IPMD."
      />

      {/* Vidéo principale en grand */}
      <div className="mt-10 overflow-hidden rounded-3xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
        <video
          src={featured}
          controls
          preload="metadata"
          playsInline
          className="aspect-video h-full w-full object-cover"
        />
      </div>

      {/* Autres vidéos en grille */}
      {rest.length > 0 && (
        <div className={`mt-5 grid gap-4 sm:gap-5 sm:grid-cols-2 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`}>
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
