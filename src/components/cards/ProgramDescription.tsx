"use client";

import { useState } from "react";

/** Description de formation tronquée à 3 lignes + « Voir plus » → popup avec le texte complet. */
export function ProgramDescription({ title, description }: { title: string; description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-black/60">
        {description}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 self-start text-sm font-semibold text-ipmd-red hover:underline"
      >
        Voir plus →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-ipmd-black">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1 text-black/50 hover:bg-black/5"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
              {description}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
