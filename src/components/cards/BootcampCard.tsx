"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bootcamp } from "@/types";

const APPROCHE_IPMD =
  "Ce bootcamp suit l'approche IPMD : 80 % de pratique et 20 % de notions essentielles. Les participants travaillent sur des cas réels de direction, de stratégie, de gouvernance et de transformation digitale, avec un livrable final directement applicable dans leur organisation.";

/** Carte d'un bootcamp certifiant (+ modal Programme si données détaillées). */
export function BootcampCard({ bootcamp }: { bootcamp: Bootcamp }) {
  const [open, setOpen] = useState(false);
  const hasProgram = (bootcamp.objectives?.length ?? 0) > 0;

  return (
    <article className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-light text-xl">
          {bootcamp.icon}
        </span>
        <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {bootcamp.format}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold text-ipmd-black">{bootcamp.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">{bootcamp.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {bootcamp.skills.map((s) => (
          <span key={s} className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-medium text-black/70">
            {s}
          </span>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-1.5 border-t border-black/5 pt-4 text-xs font-semibold text-black/50">
        <span aria-hidden>⏱️</span> {bootcamp.duration} · 80 % pratique
      </p>

      {hasProgram && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:bg-black/5"
          >
            Programme
          </button>
          <Link
            href={`/inscription-bootcamp?u=${bootcamp.universe}`}
            className="rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Admission
          </Link>
        </div>
      )}

      {/* Modal Programme */}
      {open && hasProgram && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-ipmd-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {bootcamp.format} · {bootcamp.duration}
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-ipmd-black">{bootcamp.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1 text-black/50 hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-black/65">{bootcamp.description}</p>

            <div className="mt-4 rounded-xl bg-ipmd-light p-3">
              <p className="text-sm font-bold text-ipmd-red">🎓 Approche pédagogique</p>
              <p className="mt-1 text-xs leading-relaxed text-black/65">{APPROCHE_IPMD}</p>
            </div>

            <h4 className="mt-5 text-sm font-bold text-ipmd-red">🎯 Objectifs spécifiques</h4>
            <ul className="mt-1 space-y-1 text-sm text-black/70">
              {bootcamp.objectives!.map((o) => (
                <li key={o} className="flex gap-2"><span className="text-ipmd-red">•</span>{o}</li>
              ))}
            </ul>

            {bootcamp.casPratiques && bootcamp.casPratiques.length > 0 && (
              <>
                <h4 className="mt-5 text-sm font-bold text-ipmd-red">🧪 Cas pratiques</h4>
                <ul className="mt-1 space-y-1 text-sm text-black/70">
                  {bootcamp.casPratiques.map((c) => (
                    <li key={c} className="flex gap-2"><span className="text-ipmd-red">•</span>{c}</li>
                  ))}
                </ul>
              </>
            )}

            {bootcamp.livrable && (
              <div className="mt-5 rounded-xl border border-ipmd-red/20 bg-ipmd-red/5 p-3">
                <p className="text-sm font-bold text-ipmd-red">📦 Livrable final</p>
                <p className="mt-1 text-sm text-black/70">{bootcamp.livrable}</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Link
                href={`/inscription-bootcamp?u=${bootcamp.universe}`}
                className="flex-1 rounded-full bg-ipmd-red px-6 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Demander une admission
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-6 py-3 text-sm font-semibold text-black/60 ring-1 ring-black/10 hover:bg-black/5"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
