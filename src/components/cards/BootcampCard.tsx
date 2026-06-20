import type { Bootcamp } from "@/types";

/** Carte d'un bootcamp certifiant. */
export function BootcampCard({ bootcamp }: { bootcamp: Bootcamp }) {
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

      <h3 className="mt-4 text-lg font-bold text-ipmd-black">
        {bootcamp.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">
        {bootcamp.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {bootcamp.skills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-medium text-black/70"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-1.5 border-t border-black/5 pt-4 text-xs font-semibold text-black/50">
        <span aria-hidden>⏱️</span> {bootcamp.duration}
      </p>
    </article>
  );
}
