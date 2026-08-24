"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewPaymentProof, getProofFileUrl } from "@/lib/payment-proof-review-actions";

/**
 * Actions de review d'une preuve (W3) : consulter le justificatif (URL signée
 * 5 min), Valider, ou Rejeter avec motif obligatoire. N'a aucun effet financier.
 */
export function PaymentProofReview({ proofId }: { proofId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const view = () => {
    if (pending) return;
    setMsg(null);
    startTransition(async () => {
      const res = await getProofFileUrl(proofId);
      if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else setMsg({ ok: false, text: res.message });
    });
  };

  const validate = () => {
    if (pending) return;
    if (!window.confirm("Valider cette preuve ? (preuve contrôlée conforme — aucun encaissement enregistré à ce stade)")) return;
    setMsg(null);
    startTransition(async () => {
      const res = await reviewPaymentProof(proofId, "valide", note);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  };

  const reject = () => {
    if (pending) return;
    if (!note.trim()) {
      setMsg({ ok: false, text: "Motif obligatoire pour rejeter." });
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await reviewPaymentProof(proofId, "rejete", note);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={view}
          disabled={pending}
          className="rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          👁 Voir le justificatif
        </button>
        <button
          type="button"
          onClick={validate}
          disabled={pending}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          ✅ Valider
        </button>
        <button
          type="button"
          onClick={() => setRejecting((v) => !v)}
          disabled={pending}
          className="rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          ❌ Rejeter
        </button>
      </div>

      {rejecting && (
        <div className="flex flex-col gap-2 rounded-lg bg-ipmd-light p-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motif du rejet (obligatoire) — ex. justificatif illisible, montant incohérent, référence introuvable…"
            rows={2}
            className="w-full rounded-md border border-black/15 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={reject}
            disabled={pending || !note.trim()}
            className="self-start rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "…" : "Confirmer le rejet"}
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-[12px] font-medium ${msg.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
