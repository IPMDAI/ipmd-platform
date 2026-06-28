"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ULTRABOOST_SECTORS,
  ULTRABOOST_DURATION_H,
  ULTRABOOST_PRICE,
  ULTRABOOST_SCHEDULES,
  ULTRABOOST_FORMATS,
  ULTRABOOST_INCLUDED,
  ULTRABOOST_PREREQUIS,
  ULTRABOOST_OBJECTIFS_SPECIFIQUES,
  type UltraBoostBootcamp,
} from "@/data/ultraboost";

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
                <p className="mt-2 flex-1 text-xs leading-relaxed text-white/60">
                  {ULTRABOOST_DURATION_H}h intensives · 100&nbsp;% pratique · Certificat IPMD · {ULTRABOOST_PRICE}
                </p>
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

            <p className="mt-3 text-sm text-white/70">
              Découvrez le programme complet de « {selected.title} », ses objectifs, les prérequis et le
              calendrier des sessions.
            </p>

            <div className="mt-4 space-y-1 border-y border-white/10 py-3 text-sm">
              <p><span className="text-white/55">Certification :</span> Professional Certificate — {ULTRABOOST_DURATION_H}h</p>
              <p className="text-xs text-white/45">Les conditions financières et d&apos;accompagnement sont précisées par l&apos;administration après examen de votre admission.</p>
              <p className="mt-2"><span className="text-white/55">Durée :</span> {ULTRABOOST_DURATION_H} heures</p>
            </div>

            <h4 className="mt-5 text-sm font-bold text-amber-300">🎯 Objectifs généraux</h4>
            <p className="mt-1 text-sm text-white/70">
              Renforcer vos compétences sur « {selected.title} » avec une approche actionnable, des cas réels et
              un cadre UltraBoost jusqu&apos;à la certification.
            </p>

            <h4 className="mt-4 text-sm font-bold text-white/80">Objectifs spécifiques</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              {ULTRABOOST_OBJECTIFS_SPECIFIQUES.map((o) => (
                <li key={o} className="flex gap-2"><span className="text-amber-300">•</span>{o}</li>
              ))}
            </ul>

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
