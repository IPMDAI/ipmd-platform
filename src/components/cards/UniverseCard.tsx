import Link from "next/link";
import type { Universe } from "@/types";
import { Badge } from "@/components/ui/Badge";

/** Carte d'un des 6 univers IPMD. */
export function UniverseCard({ universe }: { universe: Universe }) {
  return (
    <Link
      href={universe.href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ipmd-red/20 hover:shadow-xl"
    >
      {/* Liseré rouge animé en haut */}
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-ipmd-red transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ipmd-light text-2xl">
          {universe.icon}
        </span>
        <Badge tone={universe.kind === "diplome" ? "dark" : "red"}>
          {universe.kind === "diplome" ? "Diplômes" : "Certificats"}
        </Badge>
      </div>

      <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ipmd-black">
        {universe.name}
      </h3>
      <p className="mt-1 text-sm font-semibold text-ipmd-red">
        {universe.tagline}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-black/60">
        {universe.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {universe.credentials.map((c) => (
          <span
            key={c}
            className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-medium text-black/70"
          >
            {c}
          </span>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ipmd-black transition-colors group-hover:text-ipmd-red">
        Découvrir
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
