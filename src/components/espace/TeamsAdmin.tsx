"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EquipesData, TeamDetail } from "@/lib/teams-data";
import {
  createTeam,
  deleteTeam,
  addMember,
  removeMember,
  setLead,
  grantPermission,
  revokePermission,
} from "@/lib/teams-actions";

/**
 * Administration des Équipes & Accès par univers (super_admin). Aucune écriture
 * directe : chaque action passe par une server action (RLS super_admin-only).
 */
export function TeamsAdmin({ data }: { data: EquipesData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const permLabel = new Map(data.permissions.map((p) => [p.permission_key, p.label]));
  const uLabel = new Map(data.universes.map((u) => [u.key, u.label]));

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    if (pending) return;
    setFlash(null);
    start(async () => {
      const res = await fn();
      setFlash({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  };

  // Création d'équipe (état local)
  const [newUniverse, setNewUniverse] = useState(data.universes[0]?.key ?? "");
  const [newName, setNewName] = useState("");

  const input =
    "rounded-lg border border-black/15 px-2.5 py-1.5 text-sm outline-none focus:border-ipmd-black disabled:opacity-50";
  const btn =
    "rounded-full bg-ipmd-black px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40";
  const chip = "rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold ring-1 ring-black/10";

  return (
    <div className="space-y-8">
      {flash && (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${flash.ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-ipmd-red/10 text-ipmd-red"}`}
        >
          {flash.text}
        </p>
      )}

      {/* Créer une équipe */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-black/45">Créer une équipe</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-[11px] font-semibold text-black/55">
            Univers
            <select value={newUniverse} onChange={(e) => setNewUniverse(e.target.value)} disabled={pending} className={`${input} block`}>
              {data.universes.map((u) => (
                <option key={u.key} value={u.key}>{u.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-black/55">
            Nom de l'équipe
            <input value={newName} onChange={(e) => setNewName(e.target.value)} disabled={pending} placeholder="ex. Scolarité Campus" className={`${input} block w-64`} />
          </label>
          <button
            type="button"
            disabled={pending || !newName.trim()}
            className={btn}
            onClick={() => run(async () => { const r = await createTeam(newUniverse, newName); if (r.ok) setNewName(""); return r; })}
          >
            + Créer l'équipe
          </button>
        </div>
      </section>

      {/* Liste des équipes */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-black/45">
          Équipes ({data.teams.length})
        </h2>
        {data.teams.length === 0 && <p className="text-sm text-black/50">Aucune équipe pour l'instant.</p>}
        {data.teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            data={data}
            permLabel={permLabel}
            uLabel={uLabel}
            pending={pending}
            chip={chip}
            input={input}
            run={run}
          />
        ))}
      </section>

      {/* Droits effectifs par univers */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-black/45">Droits effectifs par univers</h2>
        <p className="mt-1 text-[12px] text-black/50">Union des permissions de chaque personne, par univers (cloisonné).</p>
        {data.effective.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">Aucun droit attribué.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-black/40">
                  <th className="px-2 py-1.5">Personne</th>
                  <th className="px-2 py-1.5">Univers</th>
                  <th className="px-2 py-1.5">Permissions effectives</th>
                </tr>
              </thead>
              <tbody>
                {data.effective.map((e) => (
                  <tr key={`${e.profileId}|${e.universe}`} className="border-t border-black/5">
                    <td className="px-2 py-1.5 font-medium text-ipmd-black">{e.name}</td>
                    <td className="px-2 py-1.5">{uLabel.get(e.universe) ?? e.universe}</td>
                    <td className="px-2 py-1.5">
                      <span className="flex flex-wrap gap-1">
                        {e.permissions.length === 0 ? (
                          <span className="text-black/40">—</span>
                        ) : (
                          e.permissions.map((p) => (
                            <span key={p} className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-200">
                              {permLabel.get(p) ?? p}
                            </span>
                          ))
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TeamCard({
  team,
  data,
  permLabel,
  uLabel,
  pending,
  chip,
  input,
  run,
}: {
  team: TeamDetail;
  data: EquipesData;
  permLabel: Map<string, string>;
  uLabel: Map<string, string>;
  pending: boolean;
  chip: string;
  input: string;
  run: (fn: () => Promise<{ ok: boolean; message: string }>) => void;
}) {
  const [pick, setPick] = useState("");
  const memberIds = new Set(team.members.map((m) => m.profileId));
  const available = data.candidates.filter((c) => !memberIds.has(c.id));
  const hasPerm = (k: string) => team.permissions.includes(k);

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className={`${chip} bg-ipmd-light`}>{uLabel.get(team.universe) ?? team.universe}</span>
          <span className="ml-2 text-base font-bold text-ipmd-black">{team.name}</span>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => { if (window.confirm(`Supprimer l'équipe « ${team.name} » ?`)) run(() => deleteTeam(team.id)); }}
          className="rounded-full bg-ipmd-red/10 px-3 py-1 text-[12px] font-semibold text-ipmd-red hover:opacity-90 disabled:opacity-40"
        >
          Supprimer
        </button>
      </div>

      {/* Membres */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">Membres ({team.members.length})</p>
        <ul className="mt-2 space-y-1.5">
          {team.members.length === 0 && <li className="text-[13px] text-black/45">Aucun membre.</li>}
          {team.members.map((m) => (
            <li key={m.profileId} className="flex flex-wrap items-center gap-2 rounded-lg bg-black/[0.03] px-2.5 py-1.5 text-[13px]">
              <span className="font-medium text-ipmd-black">{m.name}</span>
              {team.leadId === m.profileId && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Responsable</span>
              )}
              <span className="ml-auto flex gap-1.5">
                {team.leadId === m.profileId ? (
                  <button type="button" disabled={pending} onClick={() => run(() => setLead(team.id, null))} className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-black/70 hover:bg-black/10 disabled:opacity-40">
                    Retirer responsable
                  </button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => run(() => setLead(team.id, m.profileId))} className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-black/70 hover:bg-black/10 disabled:opacity-40">
                    Désigner responsable
                  </button>
                )}
                <button type="button" disabled={pending} onClick={() => run(() => removeMember(team.id, m.profileId))} className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red hover:opacity-90 disabled:opacity-40">
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} disabled={pending} className={input}>
            <option value="">Ajouter un membre…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>
            ))}
          </select>
          <button type="button" disabled={pending || !pick} onClick={() => run(async () => { const r = await addMember(team.id, pick); if (r.ok) setPick(""); return r; })} className="rounded-full bg-ipmd-black px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40">
            Ajouter
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">Permissions de l'équipe</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.permissions.map((p) => {
            const on = hasPerm(p.permission_key);
            return (
              <button
                key={p.permission_key}
                type="button"
                disabled={pending}
                onClick={() => run(() => (on ? revokePermission(team.id, p.permission_key) : grantPermission(team.id, p.permission_key)))}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 transition disabled:opacity-40 ${on ? "bg-purple-600 text-white ring-purple-600" : "bg-white text-black/60 ring-black/15 hover:ring-purple-300"}`}
                title={`${p.category} · ${p.permission_key}`}
              >
                {on ? "✓ " : "+ "}{permLabel.get(p.permission_key) ?? p.permission_key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
