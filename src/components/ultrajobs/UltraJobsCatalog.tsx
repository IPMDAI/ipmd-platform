import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ULTRAJOBS_DOMAINS } from "@/data/ultrajobs";

/** Catalogue UltraJobs : métiers regroupés par domaine, avec résumé percutant. */
export function UltraJobsCatalog() {
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
            {domain.metiers.map((m, i) => (
              <Reveal key={m.title} delay={i * 40}>
                <div className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
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
                  <Link
                    href="/inscription-bootcamp?u=ultrajobs"
                    className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ipmd-red"
                  >
                    Demander une admission →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
