"use client";

import { useEffect, useState } from "react";

export type CarouselMedia = { src: string; type: "image" | "video" };

const AUTOPLAY_MS = 2000; // défilement automatique toutes les 2 s

/**
 * Carrousel du grand média en haut des pages d'univers.
 * Défile automatiquement (2 s), en pause uniquement quand une vidéo est en lecture.
 * Les médias remplissent tout le cadre (object-cover, pas de bandes noires).
 */
export function UniverseMediaCarousel({ media }: { media: CarouselMedia[] }) {
  const [index, setIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const count = media.length;
  const current = media[index];

  const goTo = (k: number) => {
    setVideoPlaying(false);
    setIndex(((k % count) + count) % count);
  };
  const go = (delta: number) => goTo(index + delta);

  // Défilement automatique (en pause seulement si une vidéo joue).
  useEffect(() => {
    if (count <= 1 || videoPlaying) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, videoPlaying, index]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
      <div className="aspect-video w-full">
        {current.type === "video" ? (
          <video
            key={current.src}
            src={current.src}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-cover"
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => { setVideoPlaying(false); setIndex((i) => (i + 1) % count); }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.src} src={current.src} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Média précédent"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-ipmd-black shadow-lg transition hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Média suivant"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-ipmd-black shadow-lg transition hover:bg-white"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-1.5">
            {media.map((m, k) => (
              <button
                key={m.src}
                type="button"
                onClick={() => goTo(k)}
                aria-label={`Aller au média ${k + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${k === index ? "bg-ipmd-red" : "bg-white/60 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
