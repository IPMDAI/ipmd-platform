"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renewAdmissionDeadline } from "@/lib/candidature-actions";
import {
  admissionDeadlineText,
  isAdmissionExpired,
} from "@/lib/admission-deadline";

/**
 * Deadline 72 h côté admin (fiche candidature « en attente de paiement ») :
 *  • affiche le délai courant (calculé depuis admission_sent_at) ou « dépassé » ;
 *  • bouton « Renouveler le délai (72 h) » → action STRICTEMENT email-free
 *    (`renewAdmissionDeadline`), avec confirmation + motif facultatif.
 * Aucun envoi d'email/lettre/lien ; statut inchangé.
 */
export function AdmissionDeadlineAdmin({
  candidatureId,
  admissionSentAt,
}: {
  candidatureId: string;
  admissionSentAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const deadline = admissionDeadlineText(admissionSentAt);
  const expired = isAdmissionExpired(admissionSentAt);

  const renew = () => {
    if (pending) return;
    const ok = window.confirm(
      "Renouveler le délai d'admission (72 h) ?\n\n" +
        "• Le délai repart pour 72 h à partir de maintenant.\n" +
        "• AUCUN email, AUCUNE lettre, AUCUN nouveau lien ne sera envoyé.\n" +
        "• Le statut de la candidature reste inchangé.\n" +
        "• L'action est tracée (journal d'admission)."
    );
    if (!ok) return;
    const note = window.prompt("Motif du renouvellement (facultatif) :", "") ?? "";
    setMsg(null);
    startTransition(async () => {
      const res = await renewAdmissionDeadline(candidatureId, { note });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <div
      className={`mt-3 rounded-lg p-3 ring-1 ${
        expired ? "bg-ipmd-red/10 ring-ipmd-red/20" : "bg-ipmd-light ring-black/10"
      }`}
    >
      <p className={`text-[12px] font-semibold ${expired ? "text-ipmd-red" : "text-black/70"}`}>
        {expired
          ? "⏳ Délai de confirmation dépassé — place non garantie"
          : deadline
            ? `⏳ Délai de confirmation : ${deadline}`
            : "⏳ Délai de confirmation : non défini (admission non datée)"}
      </p>
      <button
        type="button"
        onClick={renew}
        disabled={pending}
        className="mt-2 rounded-full bg-ipmd-black px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Renouvellement…" : "↻ Renouveler le délai (72 h)"}
      </button>
      {msg && (
        <p className={`mt-2 text-[12px] font-medium ${msg.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
