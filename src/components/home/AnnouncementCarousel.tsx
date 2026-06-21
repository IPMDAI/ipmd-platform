"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { announcements } from "@/data/announcements";

/**
 * Carrousel d'images d'accueil (annonces, JPO, nouvelles formations…).
 * Les visuels sont affichés en plein, sans texte par-dessus.
 */
export function AnnouncementCarousel() {
  const [index, setIndex] = useState(0);
  const count = announcements.length;

  // Rotation automatique.
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section className="relative bg-ipmd-black">
      <div className="relative h-[56vh] min-h-[340px] w-full overflow-hidden sm:h-[66vh] sm:max-h-[660px]">
        {announcements.map((a, i) => {
          const visual = (
            <Image
              src={a.src}
              alt={a.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`${
                a.fit === "contain" ? "object-contain" : "object-cover"
              } transition-opacity duration-[1200ms] ease-in-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          );

          return (
            <div
              key={a.id}
              className={`absolute inset-0 ${i === index ? "z-[1]" : "z-0"}`}
              aria-hidden={i !== index}
            >
              {a.href ? (
                <Link
                  href={a.href}
                  aria-label={a.alt}
                  className="block h-full w-full"
                >
                  {visual}
                </Link>
              ) : (
                visual
              )}
            </div>
          );
        })}
      </div>

      {/* Flèches de navigation */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Visuel précédent"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur transition-colors hover:bg-ipmd-red sm:left-6"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Visuel suivant"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur transition-colors hover:bg-ipmd-red sm:right-6"
          >
            ›
          </button>
        </>
      )}

      {/* Points indicateurs */}
      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
          {announcements.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-label={`Aller au visuel ${i + 1}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-ipmd-red"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
