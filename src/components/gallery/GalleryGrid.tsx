"use client";

import { useState } from "react";
import Image from "next/image";

const STEP = 16;

/** Grille de galerie avec « Voir plus » (révèle 16 images de plus à chaque clic). */
export function GalleryGrid({ images }: { images: string[] }) {
  const [count, setCount] = useState(STEP);
  const shown = images.slice(0, count);
  const remaining = images.length - count;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {shown.map((src) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-ipmd-light ring-1 ring-black/5"
          >
            <Image
              src={src}
              alt="IPMD — vie étudiante"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + STEP)}
            className="rounded-full bg-ipmd-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ipmd-red"
          >
            Voir plus ({remaining})
          </button>
        </div>
      )}
    </>
  );
}
