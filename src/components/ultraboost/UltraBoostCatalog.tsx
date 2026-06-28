"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ULTRABOOST_SECTORS,
  ULTRABOOST_DURATION_H,
  ULTRABOOST_PRICE,
  ULTRABOOST_APPROCHE,
  ULTRABOOST_CAS_PRATIQUES,
  ULTRABOOST_LIVRABLE,
  ULTRABOOST_PUBLIC,
  ULTRABOOST_SCHEDULES,
  ULTRABOOST_FORMATS,
  ULTRABOOST_INCLUDED,
  ULTRABOOST_PREREQUIS,
  type UltraBoostBootcamp,
} from "@/data/ultraboost";

const VALUE_LINE = `${ULTRABOOST_DURATION_H}h intensives · 80 % pratique · Certificat IPMD · ${ULTRABOOST_PRICE}`;

export function UltraBoostCatalog() {
  const [selected, setSelected] = useState<UltraBoostBootcamp | null>(null);

  return (
    <div className="space-y-14 text-white sm:space-y-20">
      {/* Bootcamps groupés par secteur */}
      {ULTRABOOST_SECTORS.map((sector) => (
        <div key={sector.id}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl ring-1 ring-amber-400/20">
              {sector.icon}
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              {sector.title}
            </h3>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sector.bootcamps.map((b) => (
              <div
                key={b.id}
                className="flex flex-col rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition-colors hover:ring-amber-400/40"
              >
                <span className="w-fit rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  Executive Bootcamp
                </span>
                <h4 className="mt-3 font-bold leading-snug text-amber-200">{b.title}</h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{b.summary}</p>
                <p className="mt-3 text-xs font-medium text-white/55">{VALUE_LINE}</p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Programme
                  </button>
                  <Link
                    href={`/inscription-bootcamp?u=ultraboost`}
                    className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-ipmd-black transition-opacity hover:opacity-90"
                  >
                    Admission
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal Programme */}
      {selected && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ipmd-black p-6 text-white ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  Executive Bootcamp
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-amber-200">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1 text-white/60 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-white/70">{selected.summary}</p>

            <p className="mt-4 rounded-xl bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
              {VALUE_LINE}
            </p>

            <h4 className="mt-5 text-sm font-bold text-amber-300">🎓 Approche pédagogique</h4>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{ULTRABOOST_APPROCHE}</p>

            <h4 className="mt-5 text-sm font-bold text-amber-300">🎯 Objectifs spécifiques</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              {selected.objectives.map((o) => (
                <li key={o} className="flex gap-2"><span className="text-amber-300">•</span>{o}</li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/80">🧪 Cas pratiques</p>
                <p className="mt-1 text-xs text-white/65">{ULTRABOOST_CAS_PRATIQUES}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/80">📦 Livrable final</p>
                <p className="mt-1 text-xs text-white/65">{ULTRABOOST_LIVRABLE}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white/5 p-3">
              <p className="text-sm font-bold text-white/80">👥 Public cible</p>
              <p className="mt-1 text-xs text-white/65">{ULTRABOOST_PUBLIC}</p>
            </div>

            <h4 className="mt-5 text-sm font-bold text-amber-300">⏰ Horaires & planning — 7j/7</h4>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ULTRABOOST_SCHEDULES.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/5 p-3">
                  <p className="text-sm font-semibold">{s.icon} {s.label}</p>
                  <p className="text-xs text-white/60">{s.time}</p>
                  <p className="text-[11px] text-white/45">{s.desc}</p>
                </div>
              ))}
            </div>

            <h4 className="mt-5 text-sm font-bold text-amber-300">🎓 Formats</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              {ULTRABOOST_FORMATS.map((f) => (
                <li key={f.label}><span className="font-semibold text-white/85">{f.label}</span> : {f.desc}</li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/80">📋 Ce qui est inclus</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/65">
                  {ULTRABOOST_INCLUDED.map((i) => <li key={i}>✓ {i}</li>)}
                </ul>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/80">🎯 Prérequis</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/65">
                  {ULTRABOOST_PREREQUIS.map((p) => <li key={p}>• {p}</li>)}
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-white/50">Formats disponibles : Distance | Présentiel | Hybride | Sur-mesure</p>

            <Link
              href="/inscription-bootcamp?u=ultraboost"
              className="mt-5 block rounded-full bg-amber-400 px-6 py-3 text-center text-sm font-bold text-ipmd-black transition-opacity hover:opacity-90"
            >
              Demander une admission
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
