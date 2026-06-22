"use client";

import { useActionState } from "react";
import { notifyClassPlanning } from "@/lib/planning-actions";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function NotifyClassButton({ classId }: { classId: string }) {
  const bound = notifyClassPlanning.bind(null, classId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "📧 Notifier les étudiants"}
      </ActionButton>
      {state && (
        <span
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
