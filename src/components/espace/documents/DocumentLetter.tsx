import Image from "next/image";
import { longDate, type Dossier } from "@/lib/documents";
import { programLine, birthLine } from "@/lib/doc-format";
import { QrCode } from "@/components/espace/documents/QrCode";
import { Cachet } from "@/components/espace/documents/Cachet";
import { OfficialFooter } from "@/components/espace/documents/OfficialFooter";

type Kind = "scolarite" | "certificat" | "reussite";

const TITLES: Record<Kind, string> = {
  scolarite: "Attestation de scolarité",
  certificat: "Certificat de scolarité",
  reussite: "Attestation de réussite",
};

const TITLES_BOOTCAMP: Record<Kind, string> = {
  scolarite: "Attestation d'inscription",
  certificat: "Certificat de formation",
  reussite: "Certificat de fin de bootcamp",
};

export type DocumentSignatory = {
  title: string; // fonction, ex. « Le Directeur des Études »
  name: string; // nom affiché
  mention: string | null; // mention « par délégation » éventuelle
  signature?: string; // image de signature (si déposée dans public/)
};

/** Document officiel imprimable (attestation / certificat). */
export function DocumentLetter({
  dossier,
  kind,
  verifyHref,
  signatory,
}: {
  dossier: Dossier;
  kind: Kind;
  verifyHref: string;
  signatory: DocumentSignatory;
}) {
  const isBC = dossier.isBootcamp;
  const title = (isBC ? TITLES_BOOTCAMP : TITLES)[kind];

  return (
    <div className="document-page relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0 print:mb-2 print:border-t-[6px] print:border-ipmd-red">
      {/* Liseré décoratif (écran). À l'impression : remplacé par une vraie
          bordure rouge (border-top) qui sort toujours sur papier. */}
      <div className="h-2 w-full bg-gradient-to-r from-ipmd-black via-ipmd-red to-ipmd-black print:hidden" />

      <div className="px-8 py-10 sm:px-12 print:px-10 print:py-6">
        {/* En-tête institutionnel */}
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
              <Image
                src="/logo-ipmd.png"
                alt="Logo IPMD"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-ipmd-black">
                IPMD
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/55">
                Institut Polytechnique des Métiers du Digital
              </p>
              <p className="text-[11px] text-black/45">
                Abidjan — Côte d&apos;Ivoire · ipmd.pro
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-black/50">
            <p className="font-semibold text-ipmd-black">N° {dossier.matricule}</p>
            <p>Année {dossier.year}</p>
          </div>
        </div>

        {/* Titre */}
        <h1 className="mt-8 text-center text-xl font-extrabold uppercase tracking-wide text-ipmd-black sm:text-2xl print:mt-4">
          {title}
        </h1>
        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-ipmd-red" />

        {/* Corps */}
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-black/80 print:mt-4 print:space-y-2">
          <p>
            L&apos;Institut Polytechnique des Métiers du Digital (IPMD){" "}
            {kind === "certificat" ? "certifie" : "atteste"} que :
          </p>

          <div className="rounded-xl bg-ipmd-light px-5 py-4">
            <p className="text-lg font-extrabold text-ipmd-black">
              {dossier.name}
            </p>
            <p className="text-sm text-black/55">
              Matricule {dossier.matricule}
            </p>
            {birthLine(dossier) && (
              <p className="mt-1 text-sm text-black/55">{birthLine(dossier)}</p>
            )}
          </div>

          {kind === "reussite" ? (
            <>
              <p>
                {isBC ? (
                  <>
                    a <strong>suivi et complété avec succès</strong> le bootcamp{" "}
                    <strong>{programLine(dossier)}</strong> à l&apos;IPMD
                  </>
                ) : (
                  <>
                    a satisfait aux exigences pédagogiques de l&apos;IPMD et{" "}
                    <strong>validé son parcours</strong> en{" "}
                    <strong>{programLine(dossier)}</strong>, au titre de
                    l&apos;année académique <strong>{dossier.year}</strong>
                  </>
                )}
                {dossier.average !== null ? (
                  <>
                    , avec une moyenne générale de{" "}
                    <strong>{dossier.average}/20</strong>, mention{" "}
                    <strong>{dossier.mention}</strong>
                  </>
                ) : null}
                .
              </p>
              <p>
                {isBC ? "Le présent certificat" : "La présente attestation"} est
                délivré(e) pour servir et valoir ce que de droit.
              </p>
            </>
          ) : (
            <>
              <p>
                {isBC ? (
                  <>
                    est régulièrement inscrit(e) au bootcamp{" "}
                    <strong>{programLine(dossier)}</strong> à l&apos;IPMD, et y
                    suit assidûment la formation.
                  </>
                ) : (
                  <>
                    est régulièrement inscrit(e) à l&apos;IPMD au titre de
                    l&apos;année académique <strong>{dossier.year}</strong>, en{" "}
                    <strong>{programLine(dossier)}</strong>, et y suit assidûment
                    les enseignements.
                  </>
                )}
              </p>
              <p>
                {kind === "certificat" ? "Le présent certificat" : "La présente attestation"}{" "}
                est délivré(e) à l&apos;intéressé(e) pour servir et valoir ce
                que de droit.
              </p>
            </>
          )}
        </div>

        {/* Signature */}
        <div className="mt-12 flex items-end justify-between gap-6 print:mt-6">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
              <QrCode value={verifyHref} size={84} />
            </span>
            <div className="text-[11px] text-black/45">
              <p className="font-semibold text-ipmd-black">
                Vérifier l&apos;authenticité
              </p>
              <p>Scannez ce QR code pour confirmer ce document.</p>
              <p>Signé numériquement par l&apos;IPMD · ipmd.pro/verifier</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-black/60">Fait à Abidjan,</p>
            <p className="text-sm font-medium text-ipmd-black">
              le {longDate()}
            </p>
            {signatory.mention && (
              <p className="mt-1 text-[11px] italic text-black/55">
                {signatory.mention}
              </p>
            )}
            <div className="relative mt-3 flex h-24 w-60 items-center justify-center">
              {/* Cachet derrière */}
              <Cachet size={84} />
              {/* Signature au-dessus, entièrement contenue (jamais rognée) */}
              {signatory.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signatory.signature}
                  alt={`Signature — ${signatory.name}`}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] italic text-black/40">
                  Signature autorisée
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-ipmd-black">
              {signatory.title}
            </p>
            {signatory.name && (
              <p className="text-xs font-medium text-black/65">
                {signatory.name}
              </p>
            )}
          </div>
        </div>

        {/* NB + mentions légales officielles */}
        <OfficialFooter nb="short" />
      </div>

      {/* Pied de page */}
      <div className="bg-ipmd-black px-8 py-3 text-center text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 sm:px-12">
        Ose. Agis. Impacte. — 80% de pratique
      </div>
    </div>
  );
}
