"use client";

import { useState, useTransition } from "react";
import { setStudentClass } from "@/lib/referentiel-actions";

type Student = {
  id: string;
  full_name: string | null;
  email: string;
  class_id: string | null;
};

export function ClassAssigner({
  students,
  classes,
}: {
  students: Student[];
  classes: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<Student[]>(students);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(
    null
  );

  function change(studentId: string, classId: string) {
    setRows((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, class_id: classId || null } : s))
    );
    setFeedback(null);
    startTransition(async () => {
      const res = await setStudentClass(studentId, classId);
      setFeedback({ id: studentId, ok: res.ok });
    });
  }

  if (classes.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Créez d&apos;abord une classe pour pouvoir y affecter des étudiants.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Aucun compte étudiant pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {rows.map((s) => (
        <li
          key={s.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-ipmd-black">
              {s.full_name || "—"}
            </p>
            <p className="truncate text-sm text-black/50">{s.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {feedback?.id === s.id && (
              <span
                className={`text-xs font-medium ${
                  feedback.ok ? "text-green-600" : "text-ipmd-red"
                }`}
              >
                {feedback.ok ? "✓" : "Erreur"}
              </span>
            )}
            <select
              value={s.class_id ?? ""}
              onChange={(e) => change(s.id, e.target.value)}
              disabled={pending}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-ipmd-black outline-none transition-colors focus:border-ipmd-red disabled:opacity-50"
            >
              <option value="">— Sans classe —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </li>
      ))}
    </ul>
  );
}
