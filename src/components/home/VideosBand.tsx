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

  const single = videos.length === 1;
  const layout = single
    ? "mx-auto mt-10 max-w-4xl"
    : `mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 ${videos.length >= 3 ? "lg:grid-cols-3" : ""}`;

  return (
    <Section variant="light">
      <SectionHeading
        eyebrow="IPMD en vidéo"
        title="L'IPMD en mouvement"
        description="Cours, projets, vie de campus : découvrez l'ambiance et la pédagogie 80 % pratique de l'IPMD."
      />
      <div className={layout}>
        {videos.map((src) => (
          <div key={src} className="overflow-hidden rounded-2xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
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
    </Section>
  );
}
