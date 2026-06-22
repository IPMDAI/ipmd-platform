"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTimetableSlot } from "@/lib/planning-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { DAY_OPTIONS } from "@/lib/schedule";
import type { FormResult } from "@/types";

type Named = { id: string; name: string };

export function NewSlotForm({
  classId,
  teachers,
  rooms,
}: {
  classId: string;
  teachers: Named[];
  rooms: Named[];
}) {
  const bound = addTimetableSlot.bind(null, classId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Ajouter un créneau</h2>

      <Field label="Matière" htmlFor="p-subject" required>
        <input
          id="p-subject"
          name="subject"
          required
          placeholder="Ex. Marketing digital"
          className={inputBase}
        />
      </Field>

      <Field label="Professeur" htmlFor="p-teacher">
        <select id="p-teacher" name="teacher_id" defaultValue="" className={inputBase}>
          <option value="">— Aucun —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Salle" htmlFor="p-room">
        <select id="p-room" name="room_id" defaultValue="" className={inputBase}>
          <option value="">— Aucune —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Jour" htmlFor="p-day" required>
        <select id="p-day" name="day_of_week" required className={inputBase}>
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Début" htmlFor="p-start" required>
          <input id="p-start" name="start_time" type="time" required className={inputBase} />
        </Field>
        <Field label="Fin" htmlFor="p-end" required>
          <input id="p-end" name="end_time" type="time" required className={inputBase} />
        </Field>
      </div>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter au planning"}
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
