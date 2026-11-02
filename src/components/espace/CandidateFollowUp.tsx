"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFollowUp } from "@/lib/dossier-actions";

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Rappel de relance : programmer une date (+ note), ou marquer la relance « faite ». */
export function CandidateFollowUp({
  candidatureId,
  followUpAt,
  note,
}: {
  candidatureId: string;
  followUpAt: string | null;
  note: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState<string>(followUpAt ? followUpAt.slice(0, 10) : "");
  const [n, setN] = useState(note ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const due = followUpAt ? new Date(followUpAt).getTime() <= Date.now() : false;

  function run(dateISO: string | null) {
    setMsg(null);
    start(async () => {
      const res = await setFollowUp(candidatureId, dateISO, n);
      setMsg(res.ok ? null : res.message);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40";

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">Rappel de relance</p>

      {followUpAt && !editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
              due ? "bg-ipmd-red/10 text-ipmd-red ring-ipmd-red/20" : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
          >
            {due ? "⏰ À relancer" : "⏰ Relance"} · {frDate(followUpAt)}
          </span>
          {note && <span className="text-[11px] text-black/55">— {note}</span>}
          <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-semibold text-ipmd-red hover:underline">
            Modifier
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(null)}
            className={`${btn} bg-green-600 text-white hover:opacity-90`}
          >
            ✓ Fait
          </button>
        </div>
      ) : editing || followUpAt ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-ipmd-red"
          />
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            placeholder="Note (ex. relancer par WhatsApp)"
            className="min-w-[150px] flex-1 rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-ipmd-red"
          />
          <button
            type="button"
            disabled={pending || !date}
            onClick={() => run(date)}
            className={`${btn} bg-ipmd-black text-white hover:opacity-90`}
          >
            Programmer
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-semibold text-black/45 hover:underline">
              Annuler
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`${btn} mt-2 bg-ipmd-light text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/40`}
        >
          ⏰ Programmer une relance
        </button>
      )}

      {msg && <p className="mt-1 text-[11px] font-medium text-ipmd-red">{msg}</p>}
    </div>
  );
}
