"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section « La vie à l'IPMD » : photos réelles des étudiants en formation.
 * L'image doit être déposée dans public/etudiants-ipmd.jpg (ou .png).
 * Tant qu'elle est absente, la section se masque automatiquement (pas d'image cassée).
 */
export function StudentLife() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <Section variant="white">
      <SectionHeading
        eyebrow="La vie à l'IPMD"
        title="Nos étudiants en formation"
        description="Formations diplômantes aux métiers du digital et de l'intelligence artificielle — 80 % de pratique, sur le campus d'Abidjan."
      />
      <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/etudiants-ipmd.jpg"
          alt="Étudiants de l'IPMD en formation diplômante aux métiers du digital"
          className="h-auto w-full"
          onError={() => setHidden(true)}
        />
      </div>
    </Section>
  );
}
