"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/admin-actions";
import { ROLE_OPTIONS } from "@/lib/dashboards";

type U = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

export function RoleManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: U[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<U[]>(initialUsers);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    id: string;
    ok: boolean;
    msg: string;
  } | null>(null);

  function onChange(id: string, role: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setFeedback(null);
    startTransition(async () => {
      const res = await updateUserRole(id, role);
      setFeedback({ id, ok: res.ok, msg: res.message });
    });
  }

  if (users.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Aucun compte pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <ul className="divide-y divide-black/5">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ipmd-black">
                {u.full_name || "—"}
                {u.id === currentUserId && (
                  <span className="ml-2 rounded-full bg-ipmd-light px-2 py-0.5 text-[11px] font-medium text-black/40">
                    vous
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-black/50">{u.email}</p>
            </div>

            <div className="flex items-center gap-3">
              {feedback?.id === u.id && (
                <span
                  className={`text-xs font-medium ${
                    feedback.ok ? "text-green-600" : "text-ipmd-red"
                  }`}
                >
                  {feedback.ok ? "✓ Enregistré" : feedback.msg}
                </span>
              )}
              <select
                value={u.role}
                onChange={(e) => onChange(u.id, e.target.value)}
                disabled={pending}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-ipmd-black outline-none transition-colors focus:border-ipmd-red disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
