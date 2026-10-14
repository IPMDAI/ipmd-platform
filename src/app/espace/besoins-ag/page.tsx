import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  DecideControls,
  AssignControls,
  CloseButton,
} from "@/components/espace/StaffingAgControls";
import {
  STAFFING_STATUS,
  NEED_TYPE_LABEL,
  PRIORITY_LABEL,
  NEED_TYPES,
  PRIORITIES,
  type StaffingRequestRow,
} from "@/lib/staffing";

export const metadata: Metadata = { title: "Besoins en personnel (AG)" };

type SP = Record<string, string | undefined>;

const ROLE_FR: Record<string, string> = {
  enseignant: "Enseignant",
  admin: "Administrateur",
  super_admin: "Super admin",
  scolarite: "Scolarité",
  pedagogie: "Pédagogie",
  directeur_etudes: "Directeur des Études",
};

const PRIORITY_RANK: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Espace Administrateur Général — traitement des besoins en personnel (D6-3).
 * L'AG voit les besoins TRANSMIS (hors brouillons), décide (valider / refuser +
 * motif), affecte un profil existant ET éligible, clôture. Toutes les
 * transitions passent par les RPC D6-1. Aucune création de compte ici : si
 * aucun profil n'existe, le besoin reste « Validée » et l'AG recrute séparément
 * via le module recrutement, puis revient affecter.
 */
export default async function BesoinsAgPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const fStatut = sp.statut ?? "";
  const fPriorite = sp.priorite ?? "";
  const fAnnee = sp.annee ?? "";
  const fType = sp.type ?? "";

  // Besoins transmis (on exclut les brouillons = privés au DÉ).
  let qb = supabase
    .from("staffing_requests")
    .select(
      "id, created_at, updated_at, requester_id, requester_name, need_type, position_title, academic_year, module_id, class_id, justification, priority, proposed_profile, status, decided_at, decision_reason, assigned_profile_name, assigned_at, closed_at"
    )
    .neq("status", "brouillon");
  if (fStatut) qb = qb.eq("status", fStatut);
  if (fPriorite) qb = qb.eq("priority", fPriorite);
  if (fAnnee) qb = qb.eq("academic_year", fAnnee);
  if (fType) qb = qb.eq("need_type", fType);
  const { data: reqsRaw } = await qb.order("created_at", { ascending: false });
  const requests = ((reqsRaw ?? []) as (StaffingRequestRow & { requester_name: string | null })[]).sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
  );

  // Profils éligibles pour l'affectation (RPC gated AG/super).
  const { data: eligRaw } = await supabase.rpc("staffing_eligible_profiles");
  const eligible = ((eligRaw ?? []) as { id: string; full_name: string | null; role: string }[]).map(
    (e) => ({ id: e.id, label: `${e.full_name ?? "(sans nom)"} — ${ROLE_FR[e.role] ?? e.role}` })
  );

  // Libellés classes / modules / années (lecture publique).
  const { data: classesRaw } = await supabase.from("classes").select("id, name, filiere_id");
  const { data: modulesRaw } = await supabase.from("modules").select("id, name, filiere_id, level");
  const filIds = [
    ...new Set(
      [...(classesRaw ?? []), ...(modulesRaw ?? [])].map((x) => x.filiere_id).filter(Boolean) as string[]
    ),
  ];
  const filName = new Map<string, string>();
  if (filIds.length > 0) {
    const { data: fils } = await supabase.from("filieres").select("id, name").in("id", filIds);
    for (const f of fils ?? []) filName.set(f.id, f.name);
  }
  const classLabel = new Map<string, string>();
  for (const c of classesRaw ?? [])
    classLabel.set(c.id, c.filiere_id ? `${c.name} — ${filName.get(c.filiere_id) ?? "?"}` : c.name);
  const moduleLabel = new Map<string, string>();
  for (const m of modulesRaw ?? [])
    moduleLabel.set(m.id, `${m.name}${m.level ? ` (${m.level})` : ""}`);

  const { data: years } = await supabase
    .from("academic_years")
    .select("year")
    .order("year", { ascending: false });

  const by = (s: string) => requests.filter((r) => r.status === s);
  const boxes: { key: string; title: string; items: typeof requests }[] = [
    { key: "en_attente", title: "En attente de décision", items: by("en_attente") },
    { key: "validee", title: "Validés — à affecter", items: by("validee") },
    { key: "affectee", title: "Affectés", items: by("affectee") },
    { key: "refusee", title: "Refusés", items: by("refusee") },
    { key: "cloturee", title: "Clôturés", items: by("cloturee") },
  ];

  const selCls =
    "rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Besoins en personnel <span className="text-ipmd-red">— décision</span>
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Besoins transmis par les Directeurs des Études. Vous validez, refusez (avec motif),
            affectez un <strong>profil existant et éligible</strong>, puis clôturez. Aucun compte
            n&apos;est créé ici : si aucun profil n&apos;existe encore, le besoin reste
            « Validée » — recrutez via le module recrutement, puis revenez l&apos;affecter.
          </p>

          {/* Filtres */}
          <form className="mt-6 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-black/60">
              Statut
              <select name="statut" defaultValue={fStatut} className={`mt-0.5 block ${selCls}`}>
                <option value="">Tous</option>
                {["en_attente", "validee", "affectee", "refusee", "cloturee"].map((s) => (
                  <option key={s} value={s}>{STAFFING_STATUS[s]?.label ?? s}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              Priorité
              <select name="priorite" defaultValue={fPriorite} className={`mt-0.5 block ${selCls}`}>
                <option value="">Toutes</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              Année
              <select name="annee" defaultValue={fAnnee} className={`mt-0.5 block ${selCls}`}>
                <option value="">Toutes</option>
                {(years ?? []).map((y) => (
                  <option key={y.year} value={y.year}>{y.year}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              Type
              <select name="type" defaultValue={fType} className={`mt-0.5 block ${selCls}`}>
                <option value="">Tous</option>
                {NEED_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-ipmd-black px-4 py-2 text-sm font-semibold text-white">
              Filtrer
            </button>
            {(fStatut || fPriorite || fAnnee || fType) && (
              <Link href="/espace/besoins-ag" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black/60 ring-1 ring-black/10">
                Effacer
              </Link>
            )}
          </form>

          <div className="mt-8 space-y-8">
            {boxes.map((box) => (
              <div key={box.key}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-ipmd-black">
                  {box.title}
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/50">
                    {box.items.length}
                  </span>
                </h2>
                {box.items.length === 0 ? (
                  <p className="mt-2 text-sm text-black/40">Aucun besoin.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {box.items.map((r) => {
                      const badge = STAFFING_STATUS[r.status];
                      const urgent = r.priority === "urgente" || r.priority === "haute";
                      const accent =
                        r.priority === "urgente"
                          ? "border-l-4 border-ipmd-red"
                          : r.priority === "haute"
                          ? "border-l-4 border-amber-400"
                          : "";
                      return (
                        <li key={r.id} className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${accent}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-ipmd-black">{r.position_title}</p>
                              <p className="mt-0.5 text-sm text-black/55">
                                {NEED_TYPE_LABEL[r.need_type] ?? r.need_type}
                                {r.academic_year ? ` · ${r.academic_year}` : ""}
                                {` · priorité ${PRIORITY_LABEL[r.priority] ?? r.priority}`}
                              </p>
                              {(r.class_id || r.module_id) && (
                                <p className="mt-0.5 text-xs text-black/45">
                                  {r.class_id ? classLabel.get(r.class_id) ?? "" : ""}
                                  {r.class_id && r.module_id ? " · " : ""}
                                  {r.module_id ? moduleLabel.get(r.module_id) ?? "" : ""}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}>
                                {badge?.label ?? r.status}
                              </span>
                              {urgent && (
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${r.priority === "urgente" ? "bg-ipmd-red/10 text-ipmd-red" : "bg-amber-100 text-amber-700"}`}>
                                  {r.priority === "urgente" ? "URGENTE" : "HAUTE"}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-black/45">
                            Demandé par <strong>{r.requester_name ?? "—"}</strong> le {fmt(r.created_at)}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{r.justification}</p>
                          {r.proposed_profile && (
                            <p className="mt-1 text-xs text-black/50">
                              Profil souhaité : <span className="font-medium">{r.proposed_profile}</span>
                            </p>
                          )}

                          {/* Suivi (contexte) */}
                          {(r.status === "validee" || r.status === "affectee" || r.status === "cloturee") && r.decided_at && (
                            <p className="mt-2 text-xs text-black/45">✅ Validé le {fmt(r.decided_at)}.</p>
                          )}
                          {r.status === "refusee" && (
                            <p className="mt-2 text-xs text-ipmd-red">
                              ✕ Refusé le {fmt(r.decided_at)}{r.decision_reason ? ` — motif : ${r.decision_reason}` : ""}.
                            </p>
                          )}
                          {(r.status === "affectee" || r.status === "cloturee") && r.assigned_profile_name && (
                            <p className="mt-1 text-xs text-black/45">
                              👤 Affecté à <strong>{r.assigned_profile_name}</strong>
                              {r.assigned_at ? ` le ${fmt(r.assigned_at)}` : ""}.
                            </p>
                          )}
                          {r.status === "cloturee" && (
                            <p className="mt-1 text-xs text-black/45">🏁 Clôturé le {fmt(r.closed_at)}.</p>
                          )}

                          {/* Actions AG par statut */}
                          <div className="mt-3 border-t border-black/5 pt-3">
                            {r.status === "en_attente" && <DecideControls id={r.id} />}
                            {r.status === "validee" && <AssignControls id={r.id} eligible={eligible} />}
                            {r.status === "affectee" && <CloseButton id={r.id} label="Clôturer (besoin satisfait)" />}
                            {r.status === "refusee" && <CloseButton id={r.id} label="Clôturer / archiver" />}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
