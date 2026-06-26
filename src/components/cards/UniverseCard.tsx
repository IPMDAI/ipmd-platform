import Image from "next/image";
import Link from "next/link";
import type { Universe } from "@/types";
import { Badge } from "@/components/ui/Badge";

/** Carte d'un des 6 univers IPMD (image, infos, boutons d'accès rapides). */
export function UniverseCard({ universe }: { universe: Universe }) {
  const isDiploma = universe.kind === "diplome";
  const admissionHref = isDiploma ? "/admission" : `/inscription-bootcamp?u=${universe.id}`;
  const badgeLabel =
    universe.badge ?? (isDiploma ? "Diplômes" : universe.kind === "certificat" ? "Certificats" : "Pôle");

  const quickLinks = [
    { label: "📚 Formations", href: `${universe.href}#formations` },
    { label: "💰 Frais & Scolarité", href: "/scolarite" },
    { label: "📝 Procédure d'admission", href: "/admission" },
  ];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ipmd-red/20 hover:shadow-xl">
      {/* Image d'illustration (cliquable → page de l'univers) */}
      <Link href={universe.href} className="relative block aspect-[16/10] overflow-hidden">
        <Image
          src={universe.image}
          alt={universe.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
        <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-sm backdrop-blur">
          {universe.icon}
        </span>
        <span className="absolute right-4 top-4">
          <Badge tone="red">{badgeLabel}</Badge>
        </span>
      </Link>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-7">
        <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
          <span aria-hidden className="text-base">👥</span>
          {universe.target}
        </p>
        <Link href={universe.href} className="text-xl font-extrabold tracking-tight text-ipmd-black transition-colors hover:text-ipmd-red">
          {universe.name}
        </Link>
        <p className="mt-1 text-sm font-semibold text-ipmd-red">{universe.tagline}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-black/60">{universe.description}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {universe.credentials.map((c) => (
            <span key={c} className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-medium text-black/70">
              {c}
            </span>
          ))}
        </div>

        {universe.simple ? (
          /* Pôle de services : carte simplifiée */
          <Link
            href={universe.href}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ipmd-red px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-ipmd-red/90"
          >
            Découvrir cet univers
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        ) : (
          <>
            {/* Boutons d'accès rapides */}
            <div className="mt-5 flex flex-wrap gap-2">
              {quickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black ring-1 ring-black/5 transition-colors hover:bg-ipmd-red hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Bouton principal */}
            <Link
              href={admissionHref}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-ipmd-red px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-ipmd-red/90"
            >
              Demander une admission
            </Link>

            {/* Consulter tout l'univers */}
            <Link
              href={universe.href}
              className="mt-3 inline-flex items-center justify-center gap-1 text-sm font-semibold text-ipmd-black transition-colors hover:text-ipmd-red"
            >
              Consulter tout cet univers
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
