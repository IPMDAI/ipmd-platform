"use client";

import { useState } from "react";
import { importReturningStudents, type ImportStudent } from "@/lib/user-admin-actions";

type Row = ImportStudent & { include: boolean; statut: string };

export function ImportZohoStudents() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setDone(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      const get = (o: Record<string, string>, ...keys: string[]) => {
        for (const k of keys) {
          const hit = Object.keys(o).find((kk) => kk.trim().toLowerCase() === k.toLowerCase());
          if (hit && String(o[hit]).trim()) return String(o[hit]).trim();
        }
        return "";
      };
      const parsed: Row[] = data
        .map((o) => {
          const fullName =
            get(o, "Display Name", "Contact Name") ||
            `${get(o, "Last Name")} ${get(o, "First Name")}`.trim();
          const email = get(o, "EmailID", "Email").toLowerCase();
          const phone = get(o, "Phone", "MobilePhone", "Billing Phone", "Shipping Phone");
          const level = get(o, "CF.Niveau", "Niveau");
          const program = get(o, "CF.Formation", "Formation");
          const statut = get(o, "CF.Statut", "Statut") || "Etudiant";
          const role = /rofession/i.test(statut) ? "professionnel" : "etudiant";
          return { fullName, email, phone, level, program, role, statut, include: !!email };
        })
        .filter((r) => r.fullName);
      setRows(parsed);
      if (parsed.length === 0) setMsg("Aucune ligne lisible dans ce fichier.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Lecture impossible.");
    }
  };

  const toggle = (i: number) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, include: !r.include } : r)));

  const selected = rows.filter((r) => r.include && r.email);

  const run = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    setDone(null);
    const res = await importReturningStudents(
      selected.map(({ fullName, email, phone, level, program, role }) => ({
        fullName,
        email,
        phone,
        level,
        program,
        role,
      }))
    );
    setDone(
      `${res.message}` + (res.errors.length ? ` · ${res.errors.length} erreur(s) : ${res.errors.slice(0, 3).join(" ; ")}` : "")
    );
    setBusy(false);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div>
        <h2 className="text-lg font-bold text-ipmd-black">Import en masse (fichier Zoho / Excel)</h2>
        <p className="mt-1 text-xs text-black/50">
          Charge l&apos;export <strong>Contacts (.xlsx)</strong> : je crée les comptes, applique
          niveau, formation, rôle et coordonnées. Accès en <strong>pause</strong> (les frais/paiements se
          renseignent ensuite). Les lignes <strong>sans email</strong> sont ignorées.
        </p>
      </div>

      <label className="inline-block cursor-pointer rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
        📄 Choisir le fichier .xlsx
        <input type="file" accept=".xlsx,.xls" onChange={onFile} className="hidden" />
      </label>
      {msg && <p className="text-sm font-medium text-ipmd-red">{msg}</p>}

      {rows.length > 0 && (
        <>
          <div className="max-h-80 overflow-auto rounded-xl ring-1 ring-black/10">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-ipmd-light text-left text-[10px] uppercase tracking-wider text-black/50">
                <tr>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2 font-bold">Nom</th>
                  <th className="px-2 py-2 font-bold">Email</th>
                  <th className="px-2 py-2 font-bold">Niveau</th>
                  <th className="px-2 py-2 font-bold">Formation</th>
                  <th className="px-2 py-2 font-bold">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-black/5 ${!r.email ? "opacity-50" : ""}`}>
                    <td className="px-2 py-1.5">
                      <input type="checkbox" checked={r.include} disabled={!r.email} onChange={() => toggle(i)} className="h-4 w-4" />
                    </td>
                    <td className="px-2 py-1.5 font-medium text-ipmd-black">{r.fullName}</td>
                    <td className="px-2 py-1.5 text-black/60">{r.email || <span className="text-ipmd-red">email manquant</span>}</td>
                    <td className="px-2 py-1.5 text-black/55">{r.level}</td>
                    <td className="px-2 py-1.5 text-black/55">{r.program}</td>
                    <td className="px-2 py-1.5 text-black/55">{r.role === "professionnel" ? "Pro" : "Étudiant"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={busy || selected.length === 0}
              className="rounded-full bg-ipmd-red px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Import en cours…" : `Importer ${selected.length} étudiant(s)`}
            </button>
            <span className="text-xs text-black/45">
              {rows.length} lignes · {rows.filter((r) => !r.email).length} sans email (ignorées)
            </span>
          </div>
          {done && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{done}</p>}
        </>
      )}
    </div>
  );
}
