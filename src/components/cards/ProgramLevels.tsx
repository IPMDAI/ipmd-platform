"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CAMPUS_ADMISSION, type ProgramDetail } from "@/data/programDetails";

interface ProgramLevelsProps {
  programTitle: string;
  detail: ProgramDetail;
}

type Selection =
  | { type: "level"; index: number }
  | { type: "outcomes" }
  | { type: "admission" }
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

      {/* Bouton de candidature */}
      <button
        type="button"
        onClick={() => setSelection({ type: "admission" })}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ipmd-red"
      >
        <span aria-hidden>📝</span> Demander une admission
      </button>

      {/* Pop-up : programme d'un niveau */}
      <Modal
        open={selection?.type === "level"}
        onClose={close}
        title={`${programTitle} — Programme ${activeLevel?.level ?? ""}`}
        subtitle={activeLevel?.title}
      >
        {activeLevel?.theme && (
          <p className="-mt-1 mb-3 text-base font-bold text-ipmd-black">
            {activeLevel.theme}
          </p>
        )}
        {activeLevel?.objective && (
          <p className="mb-5 rounded-2xl bg-ipmd-light p-4 text-sm leading-relaxed text-black/75">
            <span className="font-bold text-ipmd-black">Objectif : </span>
            {activeLevel.objective}
          </p>
        )}

        <div className="space-y-6">
          {activeLevel?.semesters.map((semester) => (
            <div key={semester.name}>
              <p className="inline-block rounded-full bg-ipmd-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {semester.name}
              </p>
              {semester.title && (
                <p className="mt-2 text-sm font-bold text-ipmd-black">
                  {semester.title}
                </p>
              )}
              <ul className="mt-2.5 space-y-2">
                {semester.courses.map((course) => (
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
            </div>
          ))}
        </div>
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

      {/* Pop-up : candidature / admission */}
      <Modal
        open={selection?.type === "admission"}
        onClose={close}
        title={`${programTitle} — Candidature`}
        subtitle="Conditions d'admission"
      >
        {(() => {
          const admission = detail.admission ?? CAMPUS_ADMISSION;
          return (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-ipmd-black">
                  📂 Pièces à fournir
                </p>
                <ul className="mt-2 space-y-1.5">
                  {admission.documents.map((doc) => (
                    <li
                      key={doc}
                      className="flex items-start gap-2.5 text-sm text-black/75"
                    >
                      <span className="mt-0.5 text-ipmd-red" aria-hidden>
                        ✓
                      </span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-bold text-ipmd-black">
                  💻 Matériel nécessaire
                </p>
                <ul className="mt-2 space-y-1.5">
                  {admission.equipment.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-black/75"
                    >
                      <span className="mt-0.5 text-ipmd-red" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}

        <div className="mt-6">
          <Button href="/admission" size="lg" className="w-full">
            Déposer ma candidature
          </Button>
        </div>
      </Modal>
    </div>
  );
}
