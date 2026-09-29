"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryReglementEmailAction } from "@/lib/reglement-email-actions";

/** Bouton « Relancer » pour un email d'acceptation en échec (admin). */
export function RetryEmailButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await retryReglementEmailAction(id);
            setMsg(r.message);
            if (r.ok) router.refresh();
          })
        }
        className="rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Renvoi…" : "Relancer"}
      </button>
      {msg && <span className="text-[11px] text-black/60">{msg}</span>}
    </div>
  );
}
