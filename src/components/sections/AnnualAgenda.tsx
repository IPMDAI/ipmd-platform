import Link from "next/link";
import { getAgenda } from "@/data/agenda";

/** Agenda annuel d'un univers : temps forts mensuels (rien si aucun agenda). */
export function AnnualAgenda({ universeId }: { universeId: string }) {
  const agenda = getAgenda(universeId);
  if (!agenda) return null;

  const participationHref = "/contact";

  return (
    <div className="rounded-3xl bg-ipmd-black p-5 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ipmd-red">{agenda.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{agenda.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">{agenda.intro}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {agenda.months.map((m) => (
          <div key={m.month} className="flex flex-col rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-extrabold text-white">{m.month}</h3>
              <span className="shrink-0 rounded-full bg-ipmd-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {m.badge}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              {m.events.map((e) => (
                <p key={e} className="text-sm leading-snug text-white/80">{e}</p>
              ))}
            </div>

            <p className="mt-3 text-xs text-white/50">
              <span className="font-bold text-white/70">Fréquence :</span> {m.frequency}
            </p>
            <p className="text-xs font-semibold text-ipmd-red">{m.time}</p>

            <Link
              href={participationHref}
              className="mt-4 block rounded-full bg-ipmd-red px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            >
              Demande de participation
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
