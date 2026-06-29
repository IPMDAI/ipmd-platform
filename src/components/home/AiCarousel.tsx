import { Section } from "@/components/ui/Section";
import { UniverseMediaCarousel, type CarouselMedia } from "@/components/sections/UniverseMediaCarousel";

/**
 * Grand carrousel (images) placé juste avant la section « Un tuteur IA ».
 * Images défilant automatiquement (2 s).
 *
 * 👉 Pour changer les images : modifier la liste CAROUSEL ci-dessous
 *    (fichiers dans public/carousel-ia/).
 */
const CAROUSEL: CarouselMedia[] = [
  { src: "/carousel-ia/1.png", type: "image" },
  { src: "/carousel-ia/2.png", type: "image" },
  { src: "/carousel-ia/4.png", type: "image" },
];

export function AiCarousel() {
  if (CAROUSEL.length === 0) return null;

  return (
    <Section variant="light">
      <UniverseMediaCarousel media={CAROUSEL} />
    </Section>
  );
}
