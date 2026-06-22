"use client";

import { useState } from "react";
import { TuteurChat } from "@/components/espace/TuteurChat";

/** Bouton flottant qui ouvre le Tuteur IA depuis n'importe quelle page. */
export function TutorLauncher({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Panneau de chat */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-[min(384px,calc(100vw-2rem))] sm:bottom-24 sm:right-6">
          <div className="relative rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le tuteur"
              className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ipmd-black text-sm text-white shadow-lg transition-opacity hover:opacity-90"
            >
              ✕
            </button>
            <TuteurChat firstName={firstName} />
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir le Tuteur IA"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-ipmd-red px-4 py-3 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <span className="text-lg leading-none">{open ? "✕" : "🤖"}</span>
        <span className="hidden sm:inline">
          {open ? "Fermer" : "Tuteur IA"}
        </span>
      </button>
    </>
  );
}
