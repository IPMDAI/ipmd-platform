"use client";

import { useActionState, useState } from "react";
import { setTeacherPay } from "@/lib/pay-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export function TeacherPayForm({
  teacherId,
  payType,
  hourlyRate,
  projectFee,
}: {
  teacherId: string;
  payType: string;
  hourlyRate: number;
  projectFee: number;
}) {
  const bound = setTeacherPay.bind(null, teacherId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const [type, setType] = useState(payType || "horaire");

  return (
    <form action={action} className="mt-3 border-t border-black/5 pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-black/55">
          Type
          <select
            name="pay_type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${inputBase} mt-1 py-1.5 text-sm`}
          >
            <option value="horaire">Taux horaire</option>
            <option value="projet">Forfait projet</option>
          </select>
        </label>
        {type === "horaire" ? (
          <label className="text-xs font-semibold text-black/55">
            Taux / heure (FCFA)
            <input
              name="hourly_rate"
              type="number"
              min="0"
              step="500"
              defaultValue={hourlyRate || ""}
              placeholder="8000"
              className={`${inputBase} mt-1 py-1.5 text-sm`}
            />
          </label>
        ) : (
          <label className="text-xs font-semibold text-black/55">
            Forfait (FCFA)
            <input
              name="project_fee"
              type="number"
              min="0"
              step="5000"
              defaultValue={projectFee || ""}
              placeholder="150000"
              className={`${inputBase} mt-1 py-1.5 text-sm`}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : "Enregistrer"}
        </button>
      </div>
      {state && (
        <p
          className={`mt-2 text-xs font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
