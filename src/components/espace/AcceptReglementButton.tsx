"use client";

import { useActionState } from "react";
import { acceptReglement } from "@/lib/reglement-actions";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function AcceptReglementButton() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    acceptReglement,
    null
  );
  return (
    <form action={action} className="space-y-2">
      <label className="flex items-start gap-2 text-sm text-black/70">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-black/20" />
        <span>
          J&apos;ai lu et j&apos;accepte le règlement intérieur de l&apos;IPMD et je m&apos;engage à le respecter.
        </span>
      </label>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Confirmer ma lecture"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
