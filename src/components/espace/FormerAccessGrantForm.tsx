"use client";

import { useActionState } from "react";
import { grantFormerAccess } from "@/lib/former-access-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

/** Donne l'accès à un ancien : saisie du vrai email → met à jour le compte existant. */
export function FormerAccessGrantForm({
  profileId,
  currentEmail,
}: {
  profileId: string;
  currentEmail: string;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    grantFormerAccess.bind(null, profileId),
    null
  );

  const prefill = currentEmail.includes("@archive") ? "" : currentEmail;

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
      <input
        name="email"
        type="email"
        required
        defaultValue={prefill}
        placeholder="Son vrai email (ex. nom@gmail.com)"
        className={`${inputBase} h-9 flex-1 py-1 text-[13px]`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {pending ? "…" : "Donner l'accès"}
      </button>
      {state && (
        <p className={`w-full text-[12px] font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
