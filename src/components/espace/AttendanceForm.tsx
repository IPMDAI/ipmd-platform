"use client";

import { useActionState } from "react";
import { setSessionAttendance } from "@/lib/session-attendance-actions";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function AttendanceForm({
  sessionId,
  students,
}: {
  sessionId: string;
  students: { id: string; name: string; present: boolean }[];
}) {
  const bound = setSessionAttendance.bind(null, sessionId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="space-y-3">
      <ul className="divide-y divide-black/5 overflow-hidden rounded-xl ring-1 ring-black/10">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm font-medium text-ipmd-black">{s.name}</span>
            <label className="flex items-center gap-2 text-xs font-semibold text-black/60">
              <input
                type="checkbox"
                name={`p_${s.id}`}
                defaultChecked={s.present}
                className="h-4 w-4 rounded border-black/20 text-green-600 focus:ring-green-500"
              />
              Présent
            </label>
          </li>
        ))}
      </ul>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer l'appel"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
