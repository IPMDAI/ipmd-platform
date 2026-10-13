"use client";

import { useState, useTransition } from "react";
import { acknowledgeConvocation } from "@/lib/convocation-actions";

/** Bouton « J'ai pris connaissance » (accusé INDIVIDUEL du destinataire connecté). */
export function ConvocationAck({
  convocationId,
  acked = false,
}: {
  convocationId: string;
  acked?: boolean;
}) {
  const [done, setDone] = useState(acked);
  const [pending, start] = useTransition();

  const ack = () =>
    start(async () => {
      const r = await acknowledgeConvocation(convocationId);
      if (r.ok) setDone(true);
    });

  if (done) {
    return (
      <span className="text-xs font-semibold text-green-600">
        ✓ Réception confirmée
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={ack}
      disabled={pending}
      className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? "…" : "J'ai pris connaissance"}
    </button>
  );
}
