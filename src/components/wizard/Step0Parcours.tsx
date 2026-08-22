"use client";

import type { UniverseId } from "@/types";
import { wizardParcours } from "./parcours";

const kindBadge: Record<string, { c: string; t: string }> = {
  diplome: { c: "bg-ipmd-red/10 text-ipmd-red", t: "Diplômant" },
  certificat: { c: "bg-amber-100 text-amber-800", t: "Certifiant" },
  service: { c: "bg-black/[0.06] text-black/60", t: "Service" },
};

/**
 * Étape 0 — choix du parcours. 7 grandes cartes cliquables (comportement
 * radio : une seule sélection). Entièrement pilotée par `wizardParcours`
 * (source unique = `universes`). Aucune donnée codée en dur ici.
 */
export function Step0Parcours({
  selected,
  onSelect,
}: {
  selected: UniverseId | null;
  onSelect: (id: UniverseId) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Quel parcours souhaitez-vous suivre ?
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Choisissez la formule qui correspond à votre situation et à votre objectif.
      </p>

      <div
        role="radiogroup"
        aria-label="Choix du parcours"
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {wizardParcours.map((u) => {
          const active = selected === u.id;
          const badge = kindBadge[u.kind] ?? kindBadge.service;
          return (
            <button
              key={u.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(u.id)}
              className={`group relative flex flex-col rounded-2xl border-2 p-4 text-left transition ${
                active
                  ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/40"
                  : "border-black/20 bg-white hover:border-ipmd-red/60 hover:shadow-sm"
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white transition ${
                  active ? "bg-ipmd-red" : "bg-black/10 text-transparent"
                }`}
                aria-hidden="true"
              >
                ✓
              </span>

              <span className="text-3xl" aria-hidden="true">
                {u.icon}
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-ipmd-black">{u.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.c}`}>
                  {badge.t}
                </span>
              </span>
              <span className="mt-1 text-[13px] font-medium text-black/70">{u.tagline}</span>
              <span className="mt-2 inline-flex items-center gap-1 self-start rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-ipmd-black ring-1 ring-black/10">
                <span aria-hidden="true">👤</span> {u.target}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
