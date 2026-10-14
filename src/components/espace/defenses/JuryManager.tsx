"use client";

import { useActionState } from "react";
import { addJuryInternal, addJuryExternal, removeJury } from "@/lib/defense-actions";
import { JURY_ROLES, JURY_ROLE_LABEL } from "@/lib/defenses";
import type { FormResult } from "@/types";
import type { Opt } from "@/components/espace/defenses/DefenseCreateForm";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

export type JuryMember = {
  id: string;
  member_type: string;
  profile_name: string | null;
  external_name: string | null;
  external_function: string | null;
  external_organization: string | null;
  role: string;
};

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>;
}

function RoleSelect() {
  return (
    <select name="role" required defaultValue="" className={field}>
      <option value="" disabled>— Rôle —</option>
      {JURY_ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
    </select>
  );
}

function RemoveMember({ memberId, defenseId }: { memberId: string; defenseId: string }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    removeJury.bind(null, memberId, defenseId), null
  );
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-[11px] font-semibold text-ipmd-red">Retirer</summary>
      <form action={action} className="mt-1 flex items-center gap-2">
        <input name="reason" required className="flex-1 rounded-lg border border-black/15 px-2 py-1 text-xs" placeholder="Motif (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-red px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "OK"}
        </button>
      </form>
      <Msg state={state} />
    </details>
  );
}

export function JuryManager({
  defenseId,
  members,
  eligibleInternals,
  editable,
}: {
  defenseId: string;
  members: JuryMember[];
  eligibleInternals: Opt[];
  editable: boolean;
}) {
  const [intState, intAction, intPending] = useActionState<FormResult | null, FormData>(
    addJuryInternal.bind(null, defenseId), null
  );
  const [extState, extAction, extPending] = useActionState<FormResult | null, FormData>(
    addJuryExternal.bind(null, defenseId), null
  );

  return (
    <div className="space-y-4">
      {/* Jury actif */}
      {members.length === 0 ? (
        <p className="text-sm text-black/55">Aucun membre actif.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => {
            const interne = m.member_type === "interne";
            return (
              <li key={m.id} className="rounded-xl border border-black/10 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ipmd-black">
                      {interne ? m.profile_name ?? "—" : m.external_name ?? "—"}
                      <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-black/55">
                        {interne ? "Interne" : "Externe"}
                      </span>
                    </p>
                    <p className="text-xs text-black/50">
                      {JURY_ROLE_LABEL[m.role] ?? m.role}
                      {!interne && (m.external_function || m.external_organization)
                        ? ` · ${[m.external_function, m.external_organization].filter(Boolean).join(" · ")}`
                        : ""}
                    </p>
                  </div>
                </div>
                {editable && <RemoveMember memberId={m.id} defenseId={defenseId} />}
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Interne */}
          <form action={intAction} className="space-y-2 rounded-lg ring-1 ring-black/10 p-3">
            <p className="text-xs font-semibold text-black/70">Ajouter un juré interne</p>
            <select name="profile_id" required defaultValue="" className={field}>
              <option value="" disabled>— Profil éligible —</option>
              {eligibleInternals.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
            {eligibleInternals.length === 0 && (
              <p className="text-[11px] text-black/45">Aucun profil pédagogiquement éligible disponible.</p>
            )}
            <RoleSelect />
            <button type="submit" disabled={intPending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {intPending ? "…" : "Ajouter (interne)"}
            </button>
            <Msg state={intState} />
          </form>

          {/* Externe */}
          <form action={extAction} className="space-y-2 rounded-lg ring-1 ring-black/10 p-3">
            <p className="text-xs font-semibold text-black/70">Ajouter un juré externe (sans compte)</p>
            <input name="name" required className={field} placeholder="Nom *" />
            <input name="function" className={field} placeholder="Fonction" />
            <input name="organization" className={field} placeholder="Organisation" />
            <RoleSelect />
            <button type="submit" disabled={extPending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {extPending ? "…" : "Ajouter (externe)"}
            </button>
            <Msg state={extState} />
          </form>
        </div>
      )}
    </div>
  );
}
