import Image from "next/image";
import Link from "next/link";
import type { Universe } from "@/types";
import { Badge } from "@/components/ui/Badge";

/** Carte d'un des 6 univers IPMD. */
export function UniverseCard({ universe }: { universe: Universe }) {
  return (
    <Link
      href={universe.href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ipmd-red/20 hover:shadow-xl"
    >
      {/* Image d'illustration */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={universe.image}
          alt={universe.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Voile pour la lisibilité du badge + pictogramme */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
        <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-sm backdrop-blur">
          {universe.icon}
        </span>
        <span className="absolute right-4 top-4">
          <Badge tone="red">
            {universe.kind === "diplome" ? "Diplômes" : "Certificats"}
          </Badge>
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-7">
        <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
          <span aria-hidden className="text-base">
            👥
          </span>
          {universe.target}
        </p>
        <h3 className="text-xl font-extrabold tracking-tight text-ipmd-black">
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
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
