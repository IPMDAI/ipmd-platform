import Image from "next/image";
import { formatFCFA } from "@/lib/finance";
import { ReglementConsent } from "@/components/admission/ReglementConsent";
import { ConventionStep } from "@/components/admission/ConventionStep";
import { PaymentOptionStep } from "@/components/admission/PaymentOptionStep";
import { PaymentProofStep } from "@/components/admission/PaymentProofStep";
import type { ScheduleSnapshot } from "@/lib/admission-schedule";

/**
 * Vue publique (sans compte) du pack d'admission. Mobile-first : lisible dès
 * 360 px, cibles tactiles larges, PDF téléchargeable (nouvel onglet, iOS-safe).
 * Consultation seule pour C2 ; règlement (C3) et convention (C4) viendront ici.
 */
export function PackView({
  name,
  program,
  level,
  academicYear,
  registrationFee,
  tuitionDue,
  token,
  packId,
  reglementAcceptedAt = null,
  conventionStatus = "non_envoyee",
  signatureMethod = null,
  schedule = null,
  deadlineText = null,
  deadlineExpired = false,
  proofStatus = null,
  proofReviewNote = null,
}: {
  name: string;
  program: string | null;
  level: string | null;
  academicYear: string | null;
  registrationFee: number;
  tuitionDue: number | null;
  token: string;
  schedule?: ScheduleSnapshot | null;
  packId: string;
  reglementAcceptedAt?: string | null;
  conventionStatus?: string;
  signatureMethod?: string | null;
  deadlineText?: string | null;
  deadlineExpired?: boolean;
  proofStatus?: "a_verifier" | "valide" | "rejete" | null;
  proofReviewNote?: string | null;
}) {
  const total = registrationFee + (tuitionDue ?? 0);
  const rows: Array<[string, string]> = [
    ["Formation", program ?? "—"],
    ["Niveau", level ?? "—"],
    ["Année académique", academicYear ?? "—"],
    ["Frais d'inscription", formatFCFA(registrationFee)],
    ["Frais de scolarité (prévisionnel)", tuitionDue != null ? formatFCFA(tuitionDue) : "à préciser"],
    ["Total prévisionnel", formatFCFA(total)],
  ];

  return (
    <section className="min-h-screen bg-ipmd-light px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
            <Image src="/logo-ipmd.png" alt="IPMD" width={44} height={44} className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="font-extrabold tracking-tight text-ipmd-black">IPMD — Pack d&apos;admission</p>
            <p className="text-xs text-black/50">Institut Polytechnique des Métiers du Digital</p>
          </div>
        </div>

        {/* Carte principale */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-emerald-600 px-5 py-4 text-white sm:px-6">
            <p className="text-lg font-bold">🎉 Félicitations {name} !</p>
            <p className="mt-0.5 text-sm text-white/90">Votre candidature à l&apos;IPMD a été acceptée.</p>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ipmd-red">
              Récapitulatif prévisionnel
            </p>
            <dl className="mt-2 divide-y divide-black/5 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-black/55">{k}</dt>
                  <dd className="text-right font-semibold text-ipmd-black">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
              ⚠️ Prévisionnel — non contractuel tant que le plan de paiement n&apos;est pas confirmé.
            </p>

            {/* Téléchargement PDF (nouvel onglet → iOS-safe) */}
            <a
              href={`/admission/pack/pdf?t=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-ipmd-black px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              ⬇ Télécharger ma lettre d&apos;admission (PDF)
            </a>

            {/* Règlement intérieur (C3) */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ipmd-red">
                1. Règlement intérieur
              </p>
              <div className="mt-2">
                <ReglementConsent token={token} acceptedAt={reglementAcceptedAt} />
              </div>
            </div>

            {/* Convention de formation (C4) */}
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ipmd-red">
                2. Convention de formation
              </p>
              <div className="mt-2">
                <ConventionStep
                  token={token}
                  packId={packId}
                  conventionStatus={conventionStatus}
                  signatureMethod={signatureMethod}
                  academicYear={academicYear}
                />
              </div>
            </div>

            {/* Paiement — choix Échelonné / Comptant + échéancier (F3) */}
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ipmd-red">
                3. Paiement de la scolarité
              </p>
              <div className="mt-2">
                <PaymentOptionStep
                  token={token}
                  schedule={schedule}
                  registrationFee={registrationFee}
                  deadlineText={deadlineText}
                  deadlineExpired={deadlineExpired}
                />
              </div>
            </div>

            {/* Preuve de paiement des frais d'inscription (W2) */}
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ipmd-red">
                4. Preuve de paiement des frais d&apos;inscription
              </p>
              <div className="mt-2">
                <PaymentProofStep
                  token={token}
                  registrationFee={registrationFee}
                  proofStatus={proofStatus}
                  reviewNote={proofReviewNote}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-black/40">
          Lien personnel et sécurisé · Pour toute question : admission@ipmd.pro
        </p>
      </div>
    </section>
  );
}
