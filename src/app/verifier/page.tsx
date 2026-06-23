import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { verifyDoc } from "@/lib/doc-verify";

export const metadata: Metadata = {
  title: "Vérification de document — IPMD",
  description:
    "Vérifiez l'authenticité d'un document officiel délivré par l'IPMD.",
};

const TYPE_LABELS: Record<string, string> = {
  "attestation-scolarite": "Attestation de scolarité",
  "certificat-scolarite": "Certificat de scolarité",
  "attestation-reussite": "Attestation de réussite",
  carte: "Carte étudiant",
  recu: "Reçu de paiement",
  contrat: "Contrat de vacataire",
  bulletin: "Bulletin de notes",
  "releve-notes": "Relevé de notes",
};

export default async function VerifierPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const payload = d ? verifyDoc(d) : null;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
              <Image
                src="/logo-ipmd.png"
                alt="IPMD"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="font-extrabold tracking-tight text-ipmd-black">
                IPMD — Vérification
              </p>
              <p className="text-xs text-black/50">
                Authenticité des documents officiels
              </p>
            </div>
          </div>

          {!d ? (
            <div className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/60 shadow-sm ring-1 ring-black/5">
              Scannez le QR code présent sur un document IPMD pour vérifier son
              authenticité.
            </div>
          ) : payload ? (
            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 bg-green-600 px-6 py-4 text-white">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold">Document authentique</p>
                  <p className="text-xs text-white/85">
                    Signature vérifiée — émis par l&apos;IPMD.
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-black/5 px-6 py-2 text-sm">
                <Row label="Type de document" value={TYPE_LABELS[payload.t] ?? payload.t} />
                <Row label="Titulaire" value={payload.n} />
                <Row label="Matricule" value={payload.m} />
                <Row label="Année académique" value={payload.y} />
                {payload.t === "attestation-reussite" && (
                  <Row
                    label="Résultat"
                    value={
                      payload.a != null
                        ? `${payload.a}/20 — ${payload.me ?? ""}`.trim()
                        : "Validé"
                    }
                  />
                )}
                {(payload.t === "bulletin" || payload.t === "releve-notes") &&
                  payload.a != null && (
                    <Row label="Moyenne générale" value={`${payload.a}/20`} />
                  )}
                {payload.t === "recu" && (
                  <>
                    <Row
                      label="Montant"
                      value={
                        payload.a != null
                          ? `${Number(payload.a).toLocaleString("fr-FR")} FCFA`
                          : "—"
                      }
                    />
                    {payload.d && <Row label="Date" value={payload.d} />}
                  </>
                )}
              </dl>
              <p className="border-t border-black/5 px-6 py-3 text-[11px] text-black/45">
                Pour toute question, contactez la scolarité : info@ipmd.pro
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 bg-ipmd-red px-6 py-4 text-white">
                <span className="text-2xl">⛔</span>
                <div>
                  <p className="font-bold">Document non valide</p>
                  <p className="text-xs text-white/85">
                    Signature invalide ou document falsifié.
                  </p>
                </div>
              </div>
              <p className="px-6 py-5 text-sm text-black/60">
                Ce code ne correspond à aucun document officiel IPMD valide. En
                cas de doute, contactez la scolarité à info@ipmd.pro.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-black/50">{label}</dt>
      <dd className="text-right font-semibold text-ipmd-black">{value}</dd>
    </div>
  );
}
