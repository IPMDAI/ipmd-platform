"use client";

import { useState } from "react";
import Link from "next/link";
import type { Feed, FeedItem } from "@/data/feed";

function statusClasses(status?: string) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s.includes("ouvert")) return "bg-green-100 text-green-700";
  if (s.includes("clôtur") || s.includes("bientôt")) return "bg-amber-100 text-amber-700";
  if (s.includes("terminé")) return "bg-black/10 text-black/50";
  return "bg-ipmd-red/10 text-ipmd-red";
}

type Props = {
  feed: Feed;
  /** Affiche l'en-tête (eyebrow + titre + intro). */
  heading?: boolean;
  /** Affiche les filtres par catégorie. */
  filters?: boolean;
  /** Affiche les boutons d'action en haut. */
  actions?: boolean;
  /** Limite le nombre de cartes (mode compact accueil). */
  limit?: number;
  /** Lien « Voir tout » (mode compact). */
  moreHref?: string;
};

export function FeedBoard({ feed, heading = true, filters = true, actions = true, limit, moreHref }: Props) {
  const [active, setActive] = useState("Toutes");

  let items: FeedItem[] = active === "Toutes" ? feed.items : feed.items.filter((it) => it.tags.includes(active));
  if (limit) items = items.slice(0, limit);

  return (
    <div>
      {heading && (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ipmd-red">{feed.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">{feed.title}</h2>
          <p className="mt-3 max-w-3xl text-black/60">{feed.intro}</p>
        </>
      )}

      {/* Boutons d'action */}
      {actions && feed.actions && feed.actions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {feed.actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                a.primary
                  ? "bg-ipmd-red text-white hover:opacity-90"
                  : "bg-white text-ipmd-black ring-1 ring-black/10 hover:bg-ipmd-light"
              }`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {/* Filtres */}
      {filters && (
        <div className="mt-6 flex flex-wrap gap-2">
          {feed.filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active === f ? "bg-ipmd-red text-white" : "bg-ipmd-light text-black/60 hover:bg-black/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Cartes */}
      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-ipmd-light p-6 text-center text-sm text-black/55">
          Aucun élément dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <article
              key={it.id}
              className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {it.icon && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ipmd-red/10 text-lg">
                    {it.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold leading-snug text-ipmd-black">{it.title}</h3>
                  {it.subtitle && <p className="text-sm font-medium text-black/60">{it.subtitle}</p>}
                </div>
              </div>

              {/* Badges : catégorie + statut + meta */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-bold text-ipmd-red">
                  {it.category}
                </span>
                {it.status && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses(it.status)}`}>
                    {it.status}
                  </span>
                )}
                {it.meta?.map((m) => (
                  <span key={m} className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-medium text-black/55">
                    {m}
                  </span>
                ))}
              </div>

              {/* Dates / temps de lecture / deadline */}
              {(it.date || it.readingTime || it.deadline) && (
                <p className="mt-2 text-[11px] text-black/45">
                  {[it.date, it.readingTime && `⏱️ ${it.readingTime}`, it.deadline && `📅 ${it.deadline}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">{it.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {feed.secondaryCtaLabel && (
                  <Link
                    href={it.href ?? feed.ctaHref}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:bg-ipmd-light"
                  >
                    {feed.secondaryCtaLabel}
                  </Link>
                )}
                <Link
                  href={it.href ?? feed.ctaHref}
                  className="rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {feed.ctaLabel} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Voir tout (mode compact) */}
      {limit && moreHref && feed.items.length > limit && (
        <div className="mt-6">
          <Link
            href={moreHref}
            className="inline-flex items-center gap-1 rounded-full bg-ipmd-black px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ipmd-red"
          >
            Voir tout ({feed.items.length}) →
          </Link>
        </div>
      )}
    </div>
  );
}
