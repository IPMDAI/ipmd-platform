import Link from "next/link";
import type { Feed } from "@/data/feed";

/** Section générique en liste de cartes (IPMD News / Jobs / Opportunities). */
export function FeedSection({ feed }: { feed: Feed }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ipmd-red">{feed.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">{feed.title}</h2>
      <p className="mt-3 max-w-3xl text-black/60">{feed.intro}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {feed.items.map((it) => (
          <div
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
                <h3 className="font-bold text-ipmd-black">{it.title}</h3>
                {it.subtitle && <p className="text-sm font-medium text-black/60">{it.subtitle}</p>}
              </div>
            </div>
            {it.meta && (
              <span className="mt-3 w-fit rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-bold text-black/55">
                {it.meta}
              </span>
            )}
            <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">{it.description}</p>
            <Link
              href={feed.ctaHref}
              className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {feed.ctaLabel} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
