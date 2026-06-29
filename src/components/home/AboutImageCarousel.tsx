"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const IMAGES = ["/ipmd-propo0.png", "/ipmd-propo1.png", "/ipmd_propo7.png"];

/** Carrousel d'images de la section « À propos » (rotation auto, crossfade). */
export function AboutImageCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % IMAGES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 lg:aspect-auto lg:h-full lg:min-h-[28rem]">
      {IMAGES.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt="IPMD — Abidjan, Côte d'Ivoire"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          priority={idx === 0}
          className={`object-cover transition-opacity duration-1000 ${idx === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      {/* Puces */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1.5">
        {IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActive(idx)}
            aria-label={`Image ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>

      {/* Légende */}
      <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl bg-ipmd-black/80 p-4 backdrop-blur-sm">
        <p className="text-sm font-bold text-white">Abidjan, Côte d&apos;Ivoire</p>
        <p className="mt-0.5 text-xs text-white/70">Au service des talents du digital depuis 2019</p>
      </div>
    </div>
  );
}
