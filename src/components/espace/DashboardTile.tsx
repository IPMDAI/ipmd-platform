import Link from "next/link";
import type { DashTile } from "@/lib/dashboards";

/** Carte d'un service de l'espace (active ou « bientôt »). */
export function DashboardTile({ tile }: { tile: DashTile }) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{tile.icon}</span>
        {tile.status === "ready" ? (
          <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
            Disponible
          </span>
        ) : (
          <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-black/40">
            Bientôt
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-bold text-ipmd-black">{tile.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-black/55">
        {tile.description}
      </p>
    </>
  );

  const base =
    "block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all";

  if (tile.status === "ready" && tile.href) {
    return (
      <Link
        href={tile.href}
        className={`${base} hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={`${base} opacity-80`}>{inner}</div>;
}
