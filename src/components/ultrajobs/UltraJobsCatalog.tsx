"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ULTRAJOBS_OBJECTIFS_SPECIFIQUES,
  ULTRAJOBS_PREREQUIS,
  ULTRAJOBS_FORMATS,
  ULTRAJOBS_CRENEAUX,
} from "@/data/ultrajobs";
import type { CatalogProgram } from "@/components/wizard/project";

type Card = {
  itemId: string;
  name: string;
  category: string;
  credential: string;
  durationMonths: number | null;
  price: number | null;
};

const REGISTRATION_FEE = 185000;
const fcfa = (n: number | null) => (n != null ? `${n.toLocaleString("fr-FR")} FCFA` : "");

/**
 * Catalogue UltraJobs — 100% data-driven depuis la base (catalog_items ouverts).
 * Cartes par catégorie ; CTA « Admission » → wizard avec la formation présélectionnée.
 */
export function UltraJobsCatalog({ items }: { items: CatalogProgram[] }) {
  const [selected, setSelected] = useState<Card | null>(null);

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
        Aucune formation UltraJobs n'est ouverte pour le moment. Revenez bientôt.
      </p>
    );
  }

  const byCat = new Map<string, Card[]>();
  for (const p of items) {
    const card: Card = {
      itemId: p.itemId,
      name: p.name,
      category: p.category ?? "Autres",
      credential: p.credential ?? "Certificat",
      durationMonths: p.durationMonths ?? null,
      price: p.price ?? null,
    };
    if (!byCat.has(card.category)) byCat.set(card.category, []);
    byCat.get(card.category)!.push(card);
  }

  return (
    <div className="space-y-14">
      {[...byCat.entries()].map(([cat, cards]) => (
        <div key={cat}>
          <h3 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">{cat}</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((m) => (
              <div
                key={m.itemId}
                className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-ipmd-black">{m.name}</h4>
                  <span className="shrink-0 rounded-full bg-ipmd-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Certifiant
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-black/55">
                  {m.credential}
                  {m.durationMonths ? ` · ${m.durationMonths} mois` : ""}
                </p>
                <p className="mt-3 text-sm font-bold text-ipmd-red">
                  {fcfa(m.price)}
                  <span className="block text-[11px] font-medium text-black/45">
                    Frais d'inscription : {fcfa(REGISTRATION_FEE)}
                  </span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:bg-black/5"
                  >
                    Programme
                  </button>
                  <Link
                    href={`/admission?u=ultrajobs&item=${m.itemId}`}
                    className="rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
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
                <p className="text-xs font-bold uppercase tracking-wide text-ipmd-red">{selected.category}</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">Programme — {selected.name}</h3>
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
              <span className="font-bold text-ipmd-red">{selected.credential}</span>
              {selected.durationMonths ? <span className="text-white/55"> · {selected.durationMonths} mois</span> : null}
              {selected.price ? <span className="text-white/55"> · {fcfa(selected.price)}</span> : null}
              <span className="text-white/55"> · Inscription {fcfa(REGISTRATION_FEE)}</span>
            </p>

            <h4 className="mt-4 text-sm font-bold text-white/85">Objectifs</h4>
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
                href={`/admission?u=ultrajobs&item=${selected.itemId}`}
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
