"use client";

import { useState, useTransition } from "react";
import { setRsvp } from "@/lib/event-actions";
import { RSVP_OPTIONS } from "@/lib/events";

/** Boutons de réponse à un événement (Je participe / Peut-être / Non). */
export function RsvpButtons({
  eventId,
  current,
  disabled = false,
  ouiDisabled = false,
}: {
  eventId: string;
  current: string | null;
  disabled?: boolean;
  ouiDisabled?: boolean;
}) {
  const [choice, setChoice] = useState<string | null>(current);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const choose = (value: "oui" | "non" | "peut_etre") =>
    start(async () => {
      const r = await setRsvp(eventId, value);
      if (r.ok) setChoice(value);
      else setMsg(r.message);
    });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {RSVP_OPTIONS.map((o) => {
          const active = choice === o.value;
          const off = disabled || pending || (o.value === "oui" && ouiDisabled && !active);
          return (
            <button
              key={o.value}
              type="button"
              disabled={off}
              onClick={() => choose(o.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                active ? o.cls : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {msg && <p className="mt-1 text-[11px] font-medium text-ipmd-red">{msg}</p>}
    </div>
  );
}
