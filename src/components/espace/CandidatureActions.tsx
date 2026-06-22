"use client";

import { useState, useTransition } from "react";
import { setCandidatureStatus } from "@/lib/candidature-actions";
import { CANDIDATURE_STATUSES } from "@/lib/candidatures";

export function CandidatureActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (value: string) => {
    if (value === current || pending) return;
    setError(null);
    start(async () => {
      const res = await setCandidatureStatus(id, value);
      if (res.ok) setCurrent(value);
      else setError(res.message);
    });
  };

  return (
    <div className="mt-4 border-t border-black/5 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-black/40">Statut :</span>
        {CANDIDATURE_STATUSES.map((s) => {
          const active = current === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => change(s.value)}
              disabled={pending}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                active
                  ? "bg-ipmd-black text-white"
                  : "bg-ipmd-light text-black/60 hover:bg-black/5"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-ipmd-red">{error}</p>}
    </div>
  );
}
