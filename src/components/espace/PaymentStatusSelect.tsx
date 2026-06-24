"use client";

import { useTransition } from "react";
import { setPaymentStatus } from "@/lib/finance-actions";
import { PAYMENT_STATUS } from "@/lib/finance";

export function PaymentStatusSelect({
  paymentId,
  status,
}: {
  paymentId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setPaymentStatus(paymentId, e.target.value))}
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        PAYMENT_STATUS[status]?.cls ?? "bg-black/5 text-black/60"
      } ${pending ? "opacity-50" : ""}`}
    >
      {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
        <option key={k} value={k} className="bg-white text-ipmd-black">
          {v.label}
        </option>
      ))}
    </select>
  );
}
