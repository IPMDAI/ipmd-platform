"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { getUpcoming, type UpcomingBootcamp } from "@/data/upcoming-bootcamps";

const META = (label: string, value: string, icon: string) => ({ label, value, icon });

/** Section « Prochains bootcamps » d'un univers (rien si aucune session). */
export function UpcomingBootcamps({ universeId }: { universeId: string }) {
  if (getUpcoming(universeId).length === 0) return null;
  return (
    <Section variant="light">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-ipmd-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Sessions à venir
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Prochains bootcamps
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-black/60">
        Des sessions à <strong>dates fixes</strong> et <strong>places limitées</strong>. Une session terminée
        est remplacée par une nouvelle ; la date peut être reportée si le nombre minimum de participants
        n&apos;est pas atteint. Réservez tôt.
      </p>
      <div className="mt-8">
        <UpcomingBootcampsGrid universeId={universeId} />
      </div>
    </Section>
  );
}

/** Grille des sessions à venir (cartes + modal), sans en-tête — réutilisable. */
export function UpcomingBootcampsGrid({ universeId }: { universeId: string }) {
  const list = getUpcoming(universeId);
  const [selected, setSelected] = useState<UpcomingBootcamp | null>(null);
  if (list.length === 0) return null;

  const inscriptionHref = `/inscription-bootcamp?u=${universeId}`;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {list.map((b) => {
          const luxe = b.variant === "luxe";
          return (
            <article
              key={b.id}
              className={`flex flex-col overflow-hidden rounded-3xl bg-ipmd-black text-white shadow-xl ring-1 ${
                luxe ? "ring-amber-300/50" : "ring-amber-400/20"
              }`}
            >
              {/* Bandeau image / dégradé */}
              <div
                className={`relative flex h-32 items-end bg-gradient-to-br p-4 ${
                  luxe ? "from-amber-700/40 via-ipmd-black to-ipmd-black" : "from-amber-500/25 via-ipmd-black to-ipmd-black"
                }`}
              >
                {b.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                )}
                <div className="relative flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ipmd-black">
                    {b.badge}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    80 % de pratique
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-extrabold text-amber-200">{b.title}</h3>
                {b.subtitle && (
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300/80">{b.subtitle}</p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-white/70">{b.description}</p>

                {b.highlights && (
                  <p className="mt-3 text-sm font-semibold text-amber-200">{b.highlights.join("  ·  ")}</p>
                )}
                {b.audience && <p className="mt-1 text-xs text-white/55">🔒 {b.audience}</p>}

                {/* Infos pratiques */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {[
                    META("Date", b.date, "📅"),
                    META("Places limitées", b.places, "👥"),
                    META("Lieu", b.location, "📍"),
                    META("Frais de participation", b.price, "💳"),
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">{m.icon} {m.label}</p>
                      <p className="mt-0.5 font-semibold text-white/90">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Créneaux */}
                <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">⏰ Créneaux disponibles (au choix)</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
                    {b.slots.map((s) => (
                      <span key={s} className="text-amber-200">✓ <span className="text-white/80">{s}</span></span>
                    ))}
                  </div>
                  {b.slotsNote && <p className="mt-1 text-[11px] text-white/45">{b.slotsNote}</p>}
                </div>

                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-300/40 transition-colors hover:bg-amber-400/10"
                  >
                    Consulter le programme
                  </button>
                  <Link
                    href={inscriptionHref}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-ipmd-black transition-opacity hover:opacity-90"
                  >
                    Demande d&apos;inscription →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal Programme */}
      {selected && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ipmd-black p-6 text-white ring-1 ring-amber-300/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ipmd-black">
                  {selected.badge}
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-amber-200">{selected.title}</h3>
                {selected.subtitle && (
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300/80">{selected.subtitle}</p>
                )}
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

            <p className="mt-3 text-sm leading-relaxed text-white/75">{selected.description}</p>

            {selected.highlights && (
              <p className="mt-3 text-sm font-semibold text-amber-200">{selected.highlights.join("  ·  ")}</p>
            )}
            {selected.audience && <p className="mt-1 text-xs text-white/55">🔒 {selected.audience}</p>}

            <div className="mt-4 space-y-1 border-y border-white/10 py-3 text-sm">
              <p><span className="text-white/55">📅 Date :</span> {selected.date}</p>
              <p><span className="text-white/55">📍 Lieu :</span> {selected.location}</p>
              <p><span className="text-white/55">👥 Places :</span> {selected.places}</p>
              <p><span className="text-white/55">💳 Frais de participation :</span> <span className="font-bold text-amber-200">{selected.price}</span></p>
            </div>

            <h4 className="mt-4 text-sm font-bold text-amber-300">⏰ Créneaux disponibles (au choix)</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/75">
              {selected.slots.map((s) => (
                <li key={s} className="flex gap-2"><span className="text-amber-300">✓</span>{s}</li>
              ))}
            </ul>
            {selected.slotsNote && <p className="mt-1 text-[11px] text-white/45">{selected.slotsNote}</p>}

            <h4 className="mt-4 text-sm font-bold text-amber-300">🎯 Objectifs</h4>
            <ul className="mt-1 space-y-1 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-amber-300">•</span>Une pédagogie 80 % pratique, orientée résultats concrets et immédiatement applicables.</li>
              <li className="flex gap-2"><span className="text-amber-300">•</span>Des mises en situation et livrables sur des cas réels, encadrés par des experts.</li>
              <li className="flex gap-2"><span className="text-amber-300">•</span>Un plan d&apos;action personnalisé pour déployer les acquis dans votre activité.</li>
            </ul>

            <p className="mt-4 text-[11px] text-white/45">
              Places fixes et limitées. La session peut être reportée si le nombre minimum de participants n&apos;est pas atteint.
            </p>

            <div className="mt-5 flex gap-2">
              <Link
                href={inscriptionHref}
                className="flex-1 rounded-full bg-amber-400 px-6 py-3 text-center text-sm font-bold text-ipmd-black transition-opacity hover:opacity-90"
              >
                Demande d&apos;inscription
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
    </>
  );
}
