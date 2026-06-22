"use client";

import { useTransition } from "react";
import { setSlotStatus } from "@/lib/planning-actions";
import { SLOT_STATUSES, slotStatusClass } from "@/lib/schedule";

export function SlotStatusSelect({
  classId,
  slotId,
  current,
}: {
  classId: string;
  slotId: string;
  current: string;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await setSlotStatus(classId, slotId, e.target.value);
        })
      }
      className={`mt-1 w-full rounded-md px-2 py-1 text-[11px] font-bold outline-none disabled:opacity-50 ${slotStatusClass(
        current
      )}`}
    >
      {SLOT_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
