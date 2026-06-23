import Image from "next/image";
import { formatFCFA } from "@/lib/finance";
import { longDate } from "@/lib/documents";
import { QrCode } from "@/components/espace/documents/QrCode";

type Payment = {
  id: string;
  amount: number;
  method: string | null;
  label: string | null;
  paid_at: string;
  kind?: string | null;
  reference?: string | null;
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Reçu de paiement officiel imprimable. */
export function PaymentReceipt({
  payment,
  studentName,
  matricule,
  verifyHref,
  level,
  recap,
}: {
  payment: Payment;
  studentName: string;
  matricule: string;
  verifyHref: string;
  level?: string | null;
  recap?: { totalDue: number; totalPaid: number; balance: number };
}) {
  const kindLabel =
    payment.kind === "inscription" ? "Frais d'inscription" : "Frais de scolarité";
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0">
      <div className="h-2 w-full bg-gradient-to-r from-ipmd-black via-ipmd-red to-ipmd-black" />

      <div className="px-8 py-10 sm:px-12">
        {/* En-tête */}
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
                Institut Polytechnique des Métiers du Digital &amp; IA
              </p>
              <p className="text-[11px] text-black/45">
                Abidjan — Côte d&apos;Ivoire · ipmd.pro
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-black/50">
            <p className="font-semibold text-ipmd-black">
              Reçu N° {payment.id.slice(0, 8).toUpperCase()}
            </p>
            <p>{frDate(payment.paid_at)}</p>
          </div>
        </div>

        <h1 className="mt-8 text-center text-xl font-extrabold uppercase tracking-wide text-ipmd-black sm:text-2xl">
          Reçu de paiement
        </h1>
        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-ipmd-red" />

        {/* Détails */}
        <div className="mt-8 space-y-3 text-[15px] text-black/80">
          <p>
            Reçu de :{" "}
            <span className="font-bold text-ipmd-black">{studentName}</span>{" "}
            <span className="text-sm text-black/50">({matricule})</span>
          </p>

          <div className="overflow-hidden rounded-xl ring-1 ring-black/10">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-black/5">
                  <td className="px-4 py-3 text-black/55">Nature</td>
                  <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                    {kindLabel}
                    {payment.label ? ` · ${payment.label}` : ""}
                  </td>
                </tr>
                {level && (
                  <tr className="border-b border-black/5">
                    <td className="px-4 py-3 text-black/55">Niveau / formation</td>
                    <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                      {level}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-black/5">
                  <td className="px-4 py-3 text-black/55">Mode de paiement</td>
                  <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                    {payment.method || "—"}
                  </td>
                </tr>
                {payment.reference && (
                  <tr className="border-b border-black/5">
                    <td className="px-4 py-3 text-black/55">Référence</td>
                    <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                      {payment.reference}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-black/5">
                  <td className="px-4 py-3 text-black/55">Date</td>
                  <td className="px-4 py-3 text-right font-semibold text-ipmd-black">
                    {frDate(payment.paid_at)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {recap && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Total dû</p>
                <p className="text-sm font-bold text-ipmd-black">{formatFCFA(recap.totalDue)}</p>
              </div>
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Déjà payé</p>
                <p className="text-sm font-bold text-green-700">{formatFCFA(recap.totalPaid)}</p>
              </div>
              <div className="rounded-xl bg-ipmd-light px-2 py-3">
                <p className="text-[10px] font-semibold uppercase text-black/45">Reste</p>
                <p className="text-sm font-bold text-ipmd-red">
                  {recap.balance <= 0 ? "Soldé" : formatFCFA(recap.balance)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-ipmd-black px-5 py-4 text-white">
            <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Montant payé
            </span>
            <span className="text-2xl font-extrabold">
              {formatFCFA(Number(payment.amount))}
            </span>
          </div>
        </div>

        {/* QR + signature */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
              <QrCode value={verifyHref} size={84} />
            </span>
            <div className="text-[11px] text-black/45">
              <p className="font-semibold text-ipmd-black">
                Vérifier l&apos;authenticité
              </p>
              <p>Scannez ce QR code pour confirmer ce reçu.</p>
              <p>Signé numériquement par l&apos;IPMD · ipmd.pro/verifier</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-black/60">Fait à Abidjan,</p>
            <p className="text-sm font-medium text-ipmd-black">le {longDate()}</p>
            <p className="mt-6 text-sm font-bold text-ipmd-black">
              Le Service de la Scolarité
            </p>
          </div>
        </div>
      </div>

      <div className="bg-ipmd-black px-8 py-3 text-center text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 sm:px-12">
        Ose. Agis. Impacte. — 80% de pratique
      </div>
    </div>
  );
}
