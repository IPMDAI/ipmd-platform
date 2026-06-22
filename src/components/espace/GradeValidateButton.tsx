"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateStudentGrades } from "@/lib/bulletin-actions";

export function GradeValidateButton({
  studentId,
  semester,
  count,
}: {
  studentId: string;
  semester: string;
  count: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = () => {
    start(async () => {
      const r = await validateStudentGrades(studentId, semester);
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Validation…" : `✅ Valider ${count} note(s) en attente`}
      </button>
      {msg && <p className="mt-2 text-sm font-medium text-green-700">{msg}</p>}
    </div>
  );
}
