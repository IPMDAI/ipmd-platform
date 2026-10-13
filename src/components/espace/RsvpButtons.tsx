"use client";

import { useState, useTransition } from "react";
import { setRsvp } from "@/lib/event-actions";
import { RSVP_OPTIONS } from "@/lib/events";

/** Boutons de réponse à un événement (Je participe / Peut-être / Non). */
export function RsvpButtons({
  eventId,
  current,
}: {
  eventId: string;
  current: string | null;
}) {
  const [choice, setChoice] = useState<string | null>(current);
  const [pending, start] = useTransition();

  const choose = (value: "oui" | "non" | "peut_etre") =>
    start(async () => {
      const r = await setRsvp(eventId, value);
      if (r.ok) setChoice(value);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {RSVP_OPTIONS.map((o) => {
        const active = choice === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={pending}
            onClick={() => choose(o.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              active ? o.cls : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
