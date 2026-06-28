"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ULTRAJOBS_DOMAINS,
  ULTRAJOBS_PRICE,
  ULTRAJOBS_HOURS,
  ULTRAJOBS_OBJECTIFS_SPECIFIQUES,
  ULTRAJOBS_PREREQUIS,
  ULTRAJOBS_FORMATS,
  ULTRAJOBS_CRENEAUX,
  type UltraJobsMetier,
} from "@/data/ultrajobs";

type Selected = { metier: UltraJobsMetier; domain: string; price: string; hours: number } | null;

/** Catalogue UltraJobs : métiers par domaine, avec tarif, volume horaire et modal Programme. */
export function UltraJobsCatalog() {
  const [selected, setSelected] = useState<Selected>(null);

  return (
    <div className="space-y-14">
      {ULTRAJOBS_DOMAINS.map((domain) => (
        <div key={domain.id}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ipmd-red/10 text-xl">
              {domain.icon}
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
              {domain.title}
            </h3>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domain.metiers.map((m) => {
              const price = m.price ?? domain.price ?? ULTRAJOBS_PRICE;
              const hours = m.hours ?? domain.hours ?? ULTRAJOBS_HOURS;
              return (
              <div
                key={m.title}
                className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-ipmd-black">{m.title}</h4>
                  <span className="shrink-0 rounded-full bg-ipmd-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Intensif
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">{m.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.skills.map((s) => (
                    <span key={s} className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-medium text-black/60">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold text-ipmd-red">
                  {price}
                  <span className="font-medium text-black/45"> · {hours}h</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected({ metier: m, domain: domain.title, price, hours })}
                    className="rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:bg-black/5"
                  >
                    Programme
                  </button>
                  <Link
                    href="/inscription-bootcamp?u=ultrajobs"
                    className="rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Admission
                  </Link>
                </div>
              </div>
              );
            })}
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
                <p className="text-xs font-bold uppercase tracking-wide text-ipmd-red">{selected.domain}</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">
                  Programme — {selected.metier.title}
                </h3>
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

            <p className="mt-3 border-y border-white/10 py-3 text-sm">
              <span className="font-bold text-ipmd-red">{selected.price}</span>
              <span className="text-white/55"> · Volume horaire : </span>
              <span className="font-semibold">{selected.hours}h</span>
            </p>

            <h4 className="mt-4 text-sm font-bold text-ipmd-red">Objectif général</h4>
            <p className="mt-1 text-sm text-white/70">
              Ce programme « {selected.metier.title} » s&apos;inscrit dans le domaine {selected.domain}.
              L&apos;objectif est de vous rendre autonome et opérationnel sur les usages professionnels du
              métier, avec des livrables actionnables et une montée en compétence mesurable.
            </p>

            <h4 className="mt-4 text-sm font-bold text-white/85">Objectifs spécifiques</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              {ULTRAJOBS_OBJECTIFS_SPECIFIQUES.map((o) => (
                <li key={o} className="flex gap-2"><span className="text-ipmd-red">•</span>{o}</li>
              ))}
            </ul>

            <h4 className="mt-4 text-sm font-bold text-white/85">Prérequis</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              {ULTRAJOBS_PREREQUIS.map((p) => (
                <li key={p} className="flex gap-2"><span className="text-ipmd-red">•</span>{p}</li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/85">Formats possibles</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/65">
                  {ULTRAJOBS_FORMATS.map((f) => <li key={f}>• {f}</li>)}
                </ul>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-bold text-white/85">Créneaux horaires</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/65">
                  {ULTRAJOBS_CRENEAUX.map((c) => <li key={c}>• {c}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href="/inscription-bootcamp?u=ultrajobs"
                className="flex-1 rounded-full bg-ipmd-red px-6 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Demande d&apos;admission
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full px-6 py-3 text-sm font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
