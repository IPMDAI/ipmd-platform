import Image from "next/image";
import type { Dossier } from "@/lib/documents";
import { QrCode } from "@/components/espace/documents/QrCode";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Carte étudiant IPMD digitale (recto), pensée pour l'impression. */
export function StudentCard({
  dossier,
  verifyHref,
}: {
  dossier: Dossier;
  verifyHref: string;
}) {
  const program = [dossier.filiereName, dossier.level].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-ipmd-black text-white shadow-xl ring-1 ring-white/10 print:shadow-none">
        {/* Halo rouge */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ipmd-red/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-ipmd-red/20 blur-3xl" />
        {/* Liseré */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ipmd-red via-white/70 to-ipmd-red" />

        <div className="relative flex h-full flex-col justify-between p-5">
          {/* En-tête */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                <Image
                  src="/logo-ipmd.png"
                  alt="IPMD"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="leading-none">
                <p className="text-base font-extrabold tracking-tight">IPMD</p>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/55">
                  Métiers du Digital &amp; IA
                </p>
              </div>
            </div>
            <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em]">
              Carte étudiant
            </span>
          </div>

          {/* Identité */}
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-extrabold ring-1 ring-white/20">
              {initials(dossier.name) || "ET"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold leading-tight">
                {dossier.name}
              </p>
              {program && (
                <p className="truncate text-xs text-white/70">{program}</p>
              )}
              <p className="mt-1 font-mono text-xs tracking-wider text-ipmd-red-light">
                {dossier.matricule}
              </p>
            </div>
          </div>

          {/* Pied */}
          <div className="flex items-end justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              <p>Année académique</p>
              <p className="text-sm font-bold tracking-normal text-white">
                {dossier.year}
              </p>
            </div>
            {/* QR de vérification */}
            <span className="rounded-md bg-white p-1">
              <QrCode value={verifyHref} size={50} />
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-black/45 print:hidden">
        Carte officielle IPMD · « Ose. Agis. Impacte. »
      </p>
    </div>
  );
}
