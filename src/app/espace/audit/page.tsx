import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { roleLabels } from "@/lib/dashboards";
import {
  AUDIT_ACTION_TYPES,
  AUDIT_ACTION_LABEL,
  auditTypeBadge,
  diffFields,
} from "@/lib/audit";

export const metadata: Metadata = { title: "Journal d'activité" };

type SP = Record<string, string | undefined>;
const NO_MATCH = "00000000-0000-0000-0000-000000000000";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Journal d'activité / Audit — RÉSERVÉ super_admin (lecture seule, immuable). */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { supabase, role } = await requireAdmin();
  if (role !== "super_admin") redirect("/espace");
  const sp = await searchParams;

  // Résolution texte → ids (utilisateur / étudiant).
  async function resolveIds(text?: string): Promise<string[] | null> {
    if (!text) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${text}%,email.ilike.%${text}%`);
    const ids = (data ?? []).map((d) => d.id as string);
    return ids.length ? ids : [NO_MATCH];
  }
  const actorIds = await resolveIds(sp.actor);
  const studentIds = await resolveIds(sp.student);

  let qb = supabase
    .from("audit_log")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(300);
  if (sp.type) qb = qb.eq("action_type", sp.type);
  if (sp.role) qb = qb.eq("actor_role", sp.role);
  if (sp.entity) qb = qb.ilike("entity_type", `%${sp.entity}%`);
  if (sp.from) qb = qb.gte("occurred_at", sp.from);
  if (sp.to) qb = qb.lte("occurred_at", `${sp.to}T23:59:59`);
  if (sp.class_id) qb = qb.eq("class_id", sp.class_id);
  if (sp.module_id) qb = qb.eq("module_id", sp.module_id);
  if (actorIds) qb = qb.in("actor_id", actorIds);
  if (studentIds) qb = qb.in("student_id", studentIds);

  const { data: logs } = await qb;
  const rows = logs ?? [];

  // Résolution des noms (acteur / étudiant / enseignant).
  const ids = new Set<string>();
  for (const r of rows) {
    for (const k of ["actor_id", "student_id", "teacher_id"] as const) {
      if (r[k]) ids.add(r[k] as string);
    }
  }
  const nameById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [...ids]);
    for (const p of profs ?? [])
      nameById.set(p.id as string, (p.full_name as string) || (p.email as string));
  }
  const nm = (id: string | null) => (id ? nameById.get(id) ?? id.slice(0, 8) : "—");

  const input =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Journal d&apos;activité / Audit
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Toutes les actions sensibles tracées :{" "}
            <strong>qui → a fait quoi → sur quoi → quand → ancienne valeur → nouvelle
            valeur → motif</strong>. Lecture seule — le journal est{" "}
            <strong>immuable</strong> (ni modification ni suppression).
          </p>

          {/* Filtres */}
          <form className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-black/60">
              Utilisateur
              <input name="actor" defaultValue={sp.actor ?? ""} placeholder="nom ou email" className={input} />
            </label>
            <label className="text-xs font-semibold text-black/60">
              Rôle
              <select name="role" defaultValue={sp.role ?? ""} className={input}>
                <option value="">— Tous —</option>
                {Object.entries(roleLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              Type d&apos;action
              <select name="type" defaultValue={sp.type ?? ""} className={input}>
                <option value="">— Tous —</option>
                {AUDIT_ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              Entité
              <input name="entity" defaultValue={sp.entity ?? ""} placeholder="ex. convocations" className={input} />
            </label>
            <label className="text-xs font-semibold text-black/60">
              Étudiant
              <input name="student" defaultValue={sp.student ?? ""} placeholder="nom ou email" className={input} />
            </label>
            <label className="text-xs font-semibold text-black/60">
              Du
              <input type="date" name="from" defaultValue={sp.from ?? ""} className={input} />
            </label>
            <label className="text-xs font-semibold text-black/60">
              Au
              <input type="date" name="to" defaultValue={sp.to ?? ""} className={input} />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-ipmd-black px-4 py-2 text-sm font-semibold text-white">
                Filtrer
              </button>
              <a href="/espace/audit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black/60 ring-1 ring-black/10">
                Réinitialiser
              </a>
            </div>
          </form>

          {/* Résultats */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-black/40">
            {rows.length} entrée{rows.length > 1 ? "s" : ""} (300 max)
          </p>
          <div className="mt-2 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-black/40">
                <tr>
                  <th className="px-4 py-3">Quand</th>
                  <th className="px-4 py-3">Qui</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Sur quoi</th>
                  <th className="px-4 py-3">Changements</th>
                  <th className="px-4 py-3">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-black/45">
                      Aucune activité pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const diffs = diffFields(
                      r.old_value as Record<string, unknown> | null,
                      r.new_value as Record<string, unknown> | null
                    );
                    return (
                      <tr key={r.id as string} className="align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-black/60">
                          {fmtWhen(r.occurred_at as string)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ipmd-black">{nm(r.actor_id as string)}</div>
                          <div className="text-xs text-black/45">
                            {roleLabels[r.actor_role as string] ?? r.actor_role ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${auditTypeBadge(r.action_type as string)}`}>
                            {AUDIT_ACTION_LABEL[r.action_type as string] ?? r.action_type}
                          </span>
                          <div className="mt-1 text-xs text-black/45">{r.action as string}</div>
                        </td>
                        <td className="px-4 py-3 text-black/70">
                          <div>{r.entity_type as string}</div>
                          {r.student_id ? (
                            <div className="text-xs text-black/45">Étudiant : {nm(r.student_id as string)}</div>
                          ) : null}
                          {r.teacher_id ? (
                            <div className="text-xs text-black/45">Enseignant : {nm(r.teacher_id as string)}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {diffs.length === 0 ? (
                            <span className="text-black/35">—</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {diffs.slice(0, 6).map((d, i) => (
                                <li key={i} className="text-xs">
                                  {d.key && <span className="font-semibold text-black/60">{d.key} : </span>}
                                  <span className="text-ipmd-red/80">{d.from}</span>
                                  <span className="text-black/40"> → </span>
                                  <span className="text-green-700">{d.to}</span>
                                </li>
                              ))}
                              {diffs.length > 6 && (
                                <li className="text-xs text-black/40">+ {diffs.length - 6}…</li>
                              )}
                            </ul>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-black/60">
                          {(r.reason as string) || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
}
