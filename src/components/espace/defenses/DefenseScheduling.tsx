"use client";

import { useActionState } from "react";
import {
  scheduleDefense,
  rescheduleDefense,
  cancelDefense,
  markHeldDefense,
} from "@/lib/defense-actions";
import type { FormResult } from "@/types";
import type { Opt } from "@/components/espace/defenses/DefenseCreateForm";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>;
}

function RoomSelect({ rooms, defaultValue }: { rooms: Opt[]; defaultValue?: string }) {
  return (
    <select name="room_id" required defaultValue={defaultValue ?? ""} className={field}>
      <option value="" disabled>— Salle —</option>
      {rooms.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
    </select>
  );
}

export function DefenseScheduling({
  id,
  status,
  scheduledAt,
  roomId,
  rooms,
}: {
  id: string;
  status: string;
  scheduledAt: string | null;
  roomId: string | null;
  rooms: Opt[];
}) {
  const [schedState, schedAction, schedPending] = useActionState<FormResult | null, FormData>(
    scheduleDefense.bind(null, id), null
  );
  const [reschedState, reschedAction, reschedPending] = useActionState<FormResult | null, FormData>(
    rescheduleDefense.bind(null, id), null
  );
  const [heldState, heldAction, heldPending] = useActionState<FormResult | null, FormData>(
    markHeldDefense.bind(null, id), null
  );
  const [cancelState, cancelAction, cancelPending] = useActionState<FormResult | null, FormData>(
    cancelDefense.bind(null, id), null
  );

  // Pré-remplissage date/heure depuis scheduled_at (ISO).
  const d = scheduledAt ? new Date(scheduledAt) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dDate = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
  const dTime = d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";

  if (status === "annulee" || status === "tenue") {
    return (
      <p className="rounded-xl bg-black/5 px-3 py-2 text-xs text-black/55">
        Soutenance {status === "tenue" ? "tenue" : "annulée"} : planification figée.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {status === "a_planifier" && (
        <form action={schedAction} className="space-y-2 rounded-lg ring-1 ring-black/10 p-3">
          <p className="text-xs font-semibold text-black/70">Planifier</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" name="date" required className={field} />
            <input type="time" name="time" required className={field} />
          </div>
          <RoomSelect rooms={rooms} />
          <button type="submit" disabled={schedPending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {schedPending ? "…" : "Planifier"}
          </button>
          <Msg state={schedState} />
        </form>
      )}

      {status === "planifiee" && (
        <>
          <form
            action={heldAction}
            onSubmit={(e) => { if (!window.confirm("Marquer cette soutenance comme tenue ?")) e.preventDefault(); }}
          >
            <button type="submit" disabled={heldPending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {heldPending ? "…" : "Marquer comme tenue"}
            </button>
            <Msg state={heldState} />
          </form>

          <details className="rounded-lg ring-1 ring-black/10">
            <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">Reporter</summary>
            <form action={reschedAction} className="space-y-2 p-3">
              <input type="hidden" name="expected_at" value={scheduledAt ?? ""} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" defaultValue={dDate} required className={field} />
                <input type="time" name="time" defaultValue={dTime} required className={field} />
              </div>
              <RoomSelect rooms={rooms} defaultValue={roomId ?? ""} />
              <input name="reason" required className={field} placeholder="Motif du report (obligatoire)" />
              <button type="submit" disabled={reschedPending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                {reschedPending ? "…" : "Reporter"}
              </button>
              <Msg state={reschedState} />
            </form>
          </details>
        </>
      )}

      <details className="rounded-lg ring-1 ring-black/10">
        <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-ipmd-red">Annuler la soutenance</summary>
        <form action={cancelAction} className="space-y-2 p-3"
          onSubmit={(e) => { if (!window.confirm("Annuler cette soutenance ?")) e.preventDefault(); }}>
          <textarea name="reason" required rows={2} className={field} placeholder="Motif d'annulation (obligatoire)" />
          <button type="submit" disabled={cancelPending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {cancelPending ? "…" : "Confirmer l'annulation"}
          </button>
          <Msg state={cancelState} />
        </form>
      </details>
    </div>
  );
}
