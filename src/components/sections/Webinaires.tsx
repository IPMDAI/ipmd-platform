import Link from "next/link";
import { getWebinaires } from "@/data/webinaires";

/** Webinaires d'un univers : sessions en ligne (rien si aucun). */
export function Webinaires({ universeId }: { universeId: string }) {
  const data = getWebinaires(universeId);
  if (!data) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ipmd-red">{data.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">{data.title}</h2>
      <p className="mt-3 max-w-3xl text-black/60">{data.intro}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data.items.map((w) => (
          <div
            key={w.id}
            className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-bold text-ipmd-red">
                {w.date} · {w.time}
              </span>
              {w.tag && (
                <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black/55">
                  {w.tag}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-bold text-ipmd-black">{w.title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-black/60">{w.description}</p>
            <p className="mt-3 text-xs text-black/50">🎙️ {w.speaker}</p>
            <Link
              href="/contact"
              className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              S&apos;inscrire au webinaire
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
