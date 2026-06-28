import Link from "next/link";
import { getHubSkills } from "@/data/hubskills";

/** HubSkills d'un univers : rencontres, pitch, incubation… (rien si aucun). */
export function HubSkills({ universeId }: { universeId: string }) {
  const hub = getHubSkills(universeId);
  if (!hub) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ipmd-red">{hub.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">{hub.title}</h2>
      <p className="mt-3 max-w-3xl text-black/60">{hub.intro}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {hub.items.map((it) => (
          <div
            key={it.title}
            className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
              {it.icon}
            </span>
            <h3 className="mt-4 font-bold text-ipmd-black">{it.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-black/60">{it.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-ipmd-black p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">Envie de rejoindre HubSkills ?</p>
          <p className="text-sm text-white/60">Rencontres, pitch, incubation et accompagnement — on vous accueille.</p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 rounded-full bg-ipmd-red px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Demande de participation
        </Link>
      </div>
    </div>
  );
}
