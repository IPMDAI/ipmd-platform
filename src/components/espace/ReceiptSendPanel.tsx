"use client";

import { useState, useTransition } from "react";
import { sendReceiptEmail, logReceiptShare } from "@/lib/finance-actions";

type Recipient = { target: string; label: string; email: string | null };
type Send = { recipient: string; channel: string; sent_at: string };

function fmt(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function ReceiptSendPanel({
  paymentId,
  recipients,
  receiptUrl,
  history,
}: {
  paymentId: string;
  recipients: Recipient[];
  receiptUrl: string;
  history: Send[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const sendEmail = (target: string) =>
    start(async () => {
      const r = await sendReceiptEmail(paymentId, target);
      setMsg(r.message);
    });

  const sendAll = () =>
    start(async () => {
      const withMail = recipients.filter((r) => r.email);
      let n = 0;
      for (const r of withMail) {
        const res = await sendReceiptEmail(paymentId, r.target);
        if (res.ok) n++;
      }
      setMsg(`Reçu envoyé à ${n} destinataire(s) par email.`);
    });

  const waText = encodeURIComponent(`Bonjour, voici votre reçu de paiement IPMD : ${receiptUrl}`);
  const shareWhatsApp = (label: string) => {
    logReceiptShare(paymentId, "whatsapp", label);
    setMsg(`Partage WhatsApp ouvert pour ${label}.`);
  };

  return (
    <details className="mt-2 rounded-lg bg-ipmd-light/60 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-semibold text-ipmd-black">
        📤 Envoyer le reçu
        {history.length > 0 && (
          <span className="ml-2 rounded-full bg-green-600/10 px-2 py-0.5 text-[10px] font-bold text-green-700">
            {history.length} envoi(s)
          </span>
        )}
      </summary>

      <div className="mt-2 space-y-2">
        {/* Destinataires */}
        {recipients.map((r) => (
          <div key={r.target} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-black/65">
              {r.label}
              {r.email ? <span className="text-black/35"> · {r.email}</span> : <span className="text-ipmd-red"> · pas d&apos;email</span>}
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                disabled={pending || !r.email}
                onClick={() => sendEmail(r.target)}
                className="rounded-md bg-ipmd-black px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
              >
                ✉️ Email
              </button>
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => shareWhatsApp(r.label)}
                className="rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-semibold text-white"
              >
                WhatsApp
              </a>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={pending}
            onClick={sendAll}
            className="rounded-md bg-ipmd-red px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
          >
            {pending ? "…" : "✉️ Envoyer à tous (email)"}
          </button>
          {msg && <span className="text-[11px] text-black/55">{msg}</span>}
        </div>

        {/* Historique */}
        {history.length > 0 && (
          <ul className="mt-1 space-y-0.5 border-t border-black/5 pt-1.5">
            {history.map((h, i) => (
              <li key={i} className="text-[11px] text-black/50">
                ✓ {h.recipient} · {h.channel === "whatsapp" ? "WhatsApp" : "Email"} · {fmt(h.sent_at)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
