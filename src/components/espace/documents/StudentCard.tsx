import Image from "next/image";
import type { Dossier } from "@/lib/documents";
import { programLine } from "@/lib/doc-format";
import { QrCode } from "@/components/espace/documents/QrCode";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Année de fin (pour la date de validité), déduite de « 2025 – 2026 ». */
function endYear(year: string): string {
  const y = year.match(/\d{4}/g);
  return y ? y[y.length - 1] : "";
}

/** Carte étudiant IPMD digitale — recto unique, premium, imprimable. */
export function StudentCard({
  dossier,
  verifyHref,
}: {
  dossier: Dossier;
  verifyHref: string;
}) {
  const program = programLine(dossier);
  const validEnd = endYear(dossier.year);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-gradient-to-br from-ipmd-black via-[#210409] to-ipmd-black text-white shadow-xl ring-1 ring-white/10 print:shadow-none">
        {/* Halos rouges */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ipmd-red/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-ipmd-red/20 blur-3xl" />
        {/* Filigrane logo — centré, très discret (ne gêne pas la lecture) */}
        <Image
          src="/logo-ipmd.png"
          alt=""
          width={220}
          height={220}
          className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.05] grayscale"
        />
        {/* Liseré haut */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ipmd-red via-white/70 to-ipmd-red" />

        <div className="relative flex h-full flex-col justify-between p-4">
          {/* En-tête institutionnel */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                <Image src="/logo-ipmd.png" alt="IPMD" width={36} height={36} className="h-full w-full object-contain" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-extrabold tracking-tight">IPMD</p>
                <p className="max-w-[9.5rem] text-[7px] font-medium uppercase leading-tight tracking-[0.12em] text-white/50">
                  Institut Polytechnique des Métiers du Digital
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-ipmd-red px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em]">
              Carte étudiant
            </span>
          </div>

          {/* Identité : photo + puce + infos */}
          <div className="flex items-center gap-3">
            <span className="flex h-[4.2rem] w-[4.2rem] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-xl font-extrabold ring-1 ring-white/25">
              {dossier.avatarUrl ? (
                <Image src={dossier.avatarUrl} alt={dossier.name} width={88} height={88} className="h-full w-full object-cover" unoptimized />
              ) : (
                initials(dossier.name) || "ET"
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-8 flex-col justify-center gap-[3px] rounded-[4px] bg-gradient-to-br from-amber-200 to-amber-400 px-1 shadow-inner ring-1 ring-amber-500/40">
                  <span className="h-px w-full bg-amber-700/40" />
                  <span className="h-px w-full bg-amber-700/40" />
                  <span className="h-px w-2/3 bg-amber-700/40" />
                </span>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                  Étudiant régulier
                </span>
              </div>
              <p className="truncate text-base font-extrabold leading-tight">{dossier.name}</p>
              {program && <p className="truncate text-[11px] text-white/70">{program}</p>}
              <p className="mt-0.5 font-mono text-[11px] tracking-wider text-ipmd-red-light">
                {dossier.matricule}
              </p>
            </div>
          </div>

          {/* Bas : année + validité + QR, puis coordonnées IPMD (sur la carte) */}
          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <div className="text-[9px] uppercase tracking-wider text-white/55">
                <p>Année académique</p>
                <p className="text-xs font-bold normal-case tracking-normal text-white">
                  {dossier.year}
                </p>
                {validEnd && (
                  <p className="mt-0.5 normal-case tracking-normal text-white/45">
                    Valable jusqu&apos;au 31 juillet {validEnd}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="rounded-md bg-white p-1.5">
                  <QrCode value={verifyHref} size={46} />
                </span>
                <span className="mt-1.5 text-[8px] font-medium text-white/80">
                  Scanner pour vérifier
                </span>
              </div>
            </div>

            <div className="border-t border-white/15 pt-1.5 text-center text-[8px] leading-[1.45] text-white/75">
              <p className="font-bold uppercase tracking-wide text-white/95">
                Carte officielle IPMD — vérifiable par QR code
              </p>
              <p>IPMD — Abidjan, Côte d&apos;Ivoire</p>
              <p>www.ipmd.pro — info@ipmd.pro</p>
              <p>+225 05 75 75 88 88 / 05 66 05 14 14</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
