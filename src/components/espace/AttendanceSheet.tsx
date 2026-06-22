"use client";

import { useState, useTransition } from "react";
import { setAttendance } from "@/lib/attendance-actions";

type Row = {
  id: string;
  full_name: string | null;
  email: string;
  present: boolean;
};

export function AttendanceSheet({
  lessonId,
  students,
}: {
  lessonId: string;
  students: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(students);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggle(studentId: string, present: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === studentId ? { ...r, present } : r))
    );
    setBusyId(studentId);
    startTransition(async () => {
      await setAttendance(lessonId, studentId, present);
      setBusyId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Aucun étudiant inscrit à ce cours.
      </p>
    );
  }

  const presents = rows.filter((r) => r.present).length;

  return (
    <div>
      <p className="mb-3 text-sm text-black/55">
        <span className="font-bold text-ipmd-black">{presents}</span> présent(s)
        sur {rows.length}
      </p>
      <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ipmd-black">
                {r.full_name || "—"}
              </p>
              <p className="truncate text-sm text-black/50">{r.email}</p>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
              <button
                type="button"
                onClick={() => toggle(r.id, true)}
                disabled={pending && busyId === r.id}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  r.present
                    ? "bg-green-600 text-white"
                    : "bg-white text-black/50 hover:bg-ipmd-light"
                }`}
              >
                Présent
              </button>
              <button
                type="button"
                onClick={() => toggle(r.id, false)}
                disabled={pending && busyId === r.id}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  !r.present
                    ? "bg-ipmd-red text-white"
                    : "bg-white text-black/50 hover:bg-ipmd-light"
                }`}
              >
                Absent
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
