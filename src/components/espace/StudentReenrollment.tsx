"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatFCFA } from "@/lib/finance";
import { confirmMyReenrollment } from "@/lib/student-reenrollment-actions";
import type { StudentReenrollmentView } from "@/lib/student-reenrollment";

// Sous-composant d'affichage au NIVEAU MODULE (identité stable).
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-black/5 py-1.5 last:border-0">
      <span className="text-[13px] text-black/50">{label}</span>
      <span className="text-[13px] font-medium text-ipmd-black">{value || <em className="font-normal text-black/30">—</em>}</span>
    </div>
  );
}

/**
 * Phase B — écran étudiant de confirmation de réinscription.
 * Affiche le dossier 'prepared', fait accepter règlement + avenant, puis
 * confirme (status → student_confirmed). Aucune validation ni bascule ici.
 */
export function StudentReenrollment({ data }: { data: StudentReenrollmentView }) {
  const [reglementOk, setReglementOk] = useState(false);
  const [avenantOk, setAvenantOk] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canConfirm = reglementOk && avenantOk && !pending;

  const confirm = () => {
    if (!canConfirm) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmMyReenrollment();
      if (res.ok) setDone(true);
      else setError(res.message ?? "Erreur.");
    });
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-4xl" aria-hidden="true">✅</p>
        <h2 className="mt-3 text-2xl font-black text-ipmd-black">Réinscription confirmée</h2>
        <p className="mt-2 text-sm text-black/60">
          Merci ! Votre confirmation est enregistrée. L'administration finalisera votre dossier
          (règlement des frais d'inscription puis validation). Votre passage en classe supérieure
          ne sera effectif qu'après validation.
        </p>
        <Link href="/espace" className="mt-5 inline-block rounded-full bg-ipmd-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-ipmd-red-dark">
          Retour à mon espace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Identité & contacts */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/60">Votre identité</h3>
        <div className="mt-3">
          <Row label="Nom complet" value={data.identity.fullName} />
          <Row label="Né(e) le" value={data.identity.birthDate} />
          <Row label="Lieu de naissance" value={data.identity.birthPlace} />
          <Row label="Email" value={data.identity.email} />
          <Row label="Téléphone" value={data.identity.phone} />
          <Row label="WhatsApp" value={data.identity.whatsapp} />
        </div>
        <p className="mt-2 text-[11px] text-black/45">
          Une information incorrecte ? Signalez-le à l'administration avant de confirmer.
        </p>
      </section>

      {/* Passage proposé */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/60">Votre passage 2026-2027</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-black/[0.04] px-3 py-2 text-[13px]">
            <span className="block text-[11px] text-black/45">Classe actuelle</span>
            {data.fromClassName ?? data.fromLevel ?? "—"}
          </span>
          <span className="text-black/40" aria-hidden="true">→</span>
          <span className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
            <span className="block text-[11px] text-emerald-600">Classe de passage proposée</span>
            {data.toClassName ?? data.toLevel ?? "—"}
            {data.filiereName && <span className="block text-[11px] text-emerald-600/80">{data.filiereName}</span>}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-black/45">
          Passage proposé par l'administration ({data.toLevel ?? "—"}). Il devient effectif après validation.
        </p>
      </section>

      {/* Conditions financières (snapshot) */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/60">Conditions financières 2026-2027</h3>
        <div className="mt-3">
          <Row label="Frais d'inscription" value={data.registrationFee != null ? formatFCFA(data.registrationFee) : "—"} />
          <Row label="Scolarité" value={data.tuitionDue != null ? formatFCFA(data.tuitionDue) : "—"} />
          <Row label="Total" value={<strong>{data.totalDue != null ? formatFCFA(data.totalDue) : "—"}</strong>} />
        </div>
        <p className="mt-2 text-[11px] text-black/45">
          Le paiement des frais d'inscription se fait auprès de l'administration — aucun paiement en ligne ici.
        </p>
      </section>

      {/* Consentements */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/60">Engagements</h3>
        <label className="mt-3 flex items-start gap-2.5">
          <input type="checkbox" checked={reglementOk} onChange={(e) => setReglementOk(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span className="text-[13px] text-black/70">
            J'ai lu et j'accepte le{" "}
            <Link href="/espace/reglement" className="font-semibold text-ipmd-red underline underline-offset-2" target="_blank">
              règlement intérieur
            </Link>{" "}
            de l'IPMD.
          </span>
        </label>
        <label className="mt-3 flex items-start gap-2.5">
          <input type="checkbox" checked={avenantOk} onChange={(e) => setAvenantOk(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span className="text-[13px] text-black/70">
            J'accepte l'<strong>avenant de réinscription 2026-2027</strong> : poursuite de ma scolarité
            dans la classe de passage proposée, aux conditions financières indiquées ci-dessus.
          </span>
        </label>
      </section>

      <div>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={confirm}
          className="w-full rounded-full bg-ipmd-red px-6 py-3 text-sm font-bold text-white transition hover:bg-ipmd-red-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {pending ? "Confirmation en cours…" : "Confirmer ma réinscription"}
        </button>
        {!canConfirm && !pending && (
          <p className="mt-2 text-[12px] text-black/45">Cochez le règlement et l'avenant pour confirmer.</p>
        )}
        {error && <p className="mt-3 rounded-xl bg-ipmd-red/10 px-4 py-3 text-[13px] font-medium text-ipmd-red">{error}</p>}
      </div>
    </div>
  );
}
