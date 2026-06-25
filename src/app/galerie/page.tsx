import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/sections/PageHero";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { getGalleryImages } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Galerie — La vie à l'IPMD",
  description:
    "Cours, projets, soutenances, vie de campus : découvrez en images le quotidien des étudiants de l'IPMD à Abidjan.",
};

export default function GaleriePage() {
  const images = getGalleryImages("galerie");

  return (
    <>
      <PageHero
        eyebrow="La vie à l'IPMD"
        title="Galerie"
        description="Cours, projets, soutenances, vie de campus — l'IPMD en images."
      />
      <section className="bg-ipmd-light py-16 sm:py-24">
        <Container>
          {images.length === 0 ? (
            <p className="text-center text-black/50">Les photos seront bientôt publiées. 📸</p>
          ) : (
            <GalleryGrid images={images} />
          )}
        </Container>
      </section>
    </>
  );
}
