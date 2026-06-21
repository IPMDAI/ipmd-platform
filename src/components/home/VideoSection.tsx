"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface VideoSectionProps {
  /** Identifiant de la vidéo YouTube (la partie après ?v= ou youtu.be/). */
  videoId: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  variant?: "light" | "white";
}

/**
 * Section vidéo (YouTube). Le lecteur n'est chargé qu'au clic sur la
 * miniature (« lite embed ») → la page reste rapide.
 */
export function VideoSection({
  videoId,
  eyebrow = "Découvrir IPMD",
  title = "IPMD en vidéo",
  description = "Plongez dans l'univers IPMD : nos formations, notre pédagogie et notre vision des métiers du digital.",
  variant = "white",
}: VideoSectionProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <Section variant={variant}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />

      <div className="mx-auto mt-12 max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-ipmd-black shadow-xl ring-1 ring-black/5">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Lire la vidéo de présentation"
              className="group absolute inset-0 h-full w-full"
            >
              {/* Miniature YouTube */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15" />
              {/* Bouton play */}
              <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ipmd-red text-2xl text-white shadow-2xl shadow-ipmd-red/40 transition-transform group-hover:scale-110">
                ▶
              </span>
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}
