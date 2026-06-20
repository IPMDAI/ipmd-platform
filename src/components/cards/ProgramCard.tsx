import type { Program } from "@/types";

/** Carte d'un programme diplômant. */
export function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-light text-xl">
          {program.icon}
        </span>
        <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {program.field}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold text-ipmd-black">{program.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">
        {program.description}
      </p>

      <div className="mt-4 border-t border-black/5 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">
          Diplômes
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {program.degrees.map((d) => (
            <span
              key={d}
              className="rounded-md bg-ipmd-red/10 px-2 py-0.5 text-xs font-semibold text-ipmd-red"
            >
              {d}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-black/50">
          Entrée : {program.entryLevels.join(" · ")}
        </p>
      </div>
    </article>
  );
}
