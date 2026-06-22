"use client";

import { useTransition } from "react";
import { setSessionStatus } from "@/lib/session-actions";
import { SESSION_STATUSES, sessionStatusClass } from "@/lib/sessions";

export function SessionStatusSelect({
  sessionId,
  current,
}: {
  sessionId: string;
  current: string;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await setSessionStatus(sessionId, e.target.value);
        })
      }
      className={`rounded-md px-2 py-1 text-[11px] font-bold outline-none disabled:opacity-50 ${sessionStatusClass(
        current
      )}`}
    >
      {SESSION_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
