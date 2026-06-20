"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/** Visuels IA du carrousel de fond. */
const slides = [
  {
    src: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80&auto=format&fit=crop",
    alt: "Cerveau d'intelligence artificielle",
  },
  {
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80&auto=format&fit=crop",
    alt: "Intelligence artificielle générative",
  },
  {
    src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80&auto=format&fit=crop",
    alt: "Réseau neuronal numérique",
  },
];

/** Hero de la page d'accueil avec carrousel d'images IA en fond. */
export function Hero() {
  const [index, setIndex] = useState(0);

  // Rotation automatique des visuels.
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      5500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-ipmd-black text-white">
      {/* Carrousel d'images IA en fond */}
      <div className="absolute inset-0" aria-hidden>
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDuration: "1500ms" }}
          />
        ))}
        {/* Voile sombre dégradé pour garder le texte lisible */}
        <div className="absolute inset-0 bg-gradient-to-b from-ipmd-black/85 via-ipmd-black/70 to-ipmd-black/95" />
        <div className="absolute inset-0 bg-ipmd-black/25" />
      </div>

      {/* Décor : grille + halos rouges */}
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-ipmd-red/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-ipmd-red/20 blur-3xl"
        aria-hidden
      />

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <Badge tone="red">80 % de pratique</Badge>
          </div>

          <h1 className="mt-6 animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Institut Polytechnique
            <br />
            des <span className="text-ipmd-red-light">Métiers du Digital</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-white/80 sm:text-xl"
            style={{ animationDelay: "100ms" }}
          >
            École supérieure digitale, moderne et orientée intelligence
            artificielle. Formez-vous aux métiers du digital pour une
            employabilité réelle.
          </p>

          <p
            className="mt-8 animate-fade-up text-2xl font-black tracking-tight sm:text-3xl"
            style={{ animationDelay: "150ms" }}
          >
            Ose. <span className="text-ipmd-red-light">Agis.</span> Impacte.
          </p>

          <div
            className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "200ms" }}
          >
            <Button href="/formations" size="lg">
              Découvrir nos formations
            </Button>
            <Button
              href="/admission"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white hover:text-ipmd-black"
            >
              Demander une inscription
            </Button>
          </div>

          {/* Mini-statistiques */}
          <div
            className="mx-auto mt-16 grid max-w-2xl animate-fade-up grid-cols-3 gap-6 border-t border-white/15 pt-8"
            style={{ animationDelay: "250ms" }}
          >
            {[
              { value: "6", label: "univers de formation" },
              { value: "35+", label: "bootcamps certifiants" },
              { value: "80%", label: "de pratique" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-ipmd-red-light">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Indicateurs du carrousel */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Voir le visuel ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? "w-8 bg-ipmd-red"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
