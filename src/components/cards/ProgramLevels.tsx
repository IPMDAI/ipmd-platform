"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ProgramDetail } from "@/data/programDetails";

interface ProgramLevelsProps {
  programTitle: string;
  detail: ProgramDetail;
}

type Selection =
  | { type: "level"; index: number }
  | { type: "outcomes" }
  | null;

/** Boutons « Programme Bac+1 → Bac+5 » + « Débouchés », chacun ouvrant une pop-up. */
export function ProgramLevels({ programTitle, detail }: ProgramLevelsProps) {
  const [selection, setSelection] = useState<Selection>(null);

  const close = () => setSelection(null);
  const activeLevel =
    selection?.type === "level" ? detail.levels[selection.index] : null;

  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">
        Programmes par niveau
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {detail.levels.map((lvl, i) => (
          <button
            key={lvl.level}
            type="button"
            onClick={() => setSelection({ type: "level", index: i })}
            className="rounded-lg border border-ipmd-black/15 px-2.5 py-1 text-xs font-semibold text-ipmd-black transition-colors hover:border-ipmd-black hover:bg-ipmd-black hover:text-white"
          >
            {lvl.level}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelection({ type: "outcomes" })}
          className="rounded-lg bg-ipmd-red px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-ipmd-red-dark"
        >
          Débouchés
        </button>
      </div>

      {/* Pop-up : programme d'un niveau */}
      <Modal
        open={selection?.type === "level"}
        onClose={close}
        title={`${programTitle} — Programme ${activeLevel?.level ?? ""}`}
        subtitle={activeLevel?.title}
      >
        <ul className="space-y-2.5">
          {activeLevel?.courses.map((course) => (
            <li
              key={course}
              className="flex items-start gap-2.5 text-sm text-black/75"
            >
              <span className="mt-0.5 text-ipmd-red" aria-hidden>
                ✓
              </span>
              {course}
            </li>
          ))}
        </ul>
      </Modal>

      {/* Pop-up : débouchés */}
      <Modal
        open={selection?.type === "outcomes"}
        onClose={close}
        title={`${programTitle} — Débouchés`}
        subtitle="Métiers et postes accessibles"
      >
        <div className="flex flex-wrap gap-2">
          {detail.outcomes.map((job) => (
            <span
              key={job}
              className="rounded-full bg-ipmd-light px-3 py-1.5 text-sm font-medium text-ipmd-black"
            >
              {job}
            </span>
          ))}
        </div>
      </Modal>
    </div>
  );
}
