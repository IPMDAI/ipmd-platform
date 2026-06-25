import Image from "next/image";
import type { Program } from "@/types";
import { getProgramImage } from "@/data/programs";
import { getProgramDetail } from "@/data/programDetails";
import { ProgramLevels } from "@/components/cards/ProgramLevels";
import { ProgramDescription } from "@/components/cards/ProgramDescription";

/** Carte d'un programme diplômant. */
export function ProgramCard({ program }: { program: Program }) {
  const detail = getProgramDetail(program.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image d'illustration */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={program.image ?? getProgramImage(program.field)}
          alt={program.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/15" />
        <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm backdrop-blur">
          {program.icon}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-ipmd-red px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {program.field}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-ipmd-black">{program.title}</h3>
        <div className="mt-2 flex flex-1 flex-col">
          <ProgramDescription title={program.title} description={program.description} />
        </div>

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

        {detail && (
          <ProgramLevels programTitle={program.title} detail={detail} />
        )}
      </div>
    </article>
  );
}
