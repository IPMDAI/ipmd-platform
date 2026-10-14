import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { StaffingRequestForm, type StaffingOptions } from "@/components/espace/StaffingRequestForm";
import { StaffingDraftCard } from "@/components/espace/StaffingDraftCard";
import {
  STAFFING_STATUS,
  NEED_TYPE_LABEL,
  PRIORITY_LABEL,
  type StaffingRequestRow,
} from "@/lib/staffing";

export const metadata: Metadata = { title: "Besoins en personnel" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Espace Directeur des Études — « Besoins en personnel » (D6-2).
 * Le DÉ exprime et SUIT ses besoins : crée/édite un brouillon, le soumet à
 * l'Administrateur Général, puis suit l'état. Il ne valide/refuse/affecte/
 * recrute JAMAIS (ces pouvoirs sont à l'AG). La base est l'autorité finale.
 */
export default async function BesoinsPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (me?.role !== "directeur_etudes") redirect("/espace");

  // Mes besoins (la RLS ne renvoie que les miens).
  const { data: reqs } = await supabase
    .from("staffing_requests")
    .select(
      "id, created_at, updated_at, need_type, position_title, academic_year, module_id, class_id, justification, priority, proposed_profile, status, decided_at, decision_reason, assigned_profile_name, assigned_at, closed_at"
    )
    .order("created_at", { ascending: false });
  const requests = (reqs ?? []) as StaffingRequestRow[];

  // Options des formulaires (années / classes / modules) — DÉ a le SELECT (D2).
  const { data: years } = await supabase
    .from("academic_years")
    .select("year, status")
    .order("year", { ascending: false });
  const { data: classesRaw } = await supabase
    .from("classes")
    .select("id, name, filiere_id")
    .order("name");
  const { data: modulesRaw } = await supabase
    .from("modules")
    .select("id, name, filiere_id, level")
    .order("name");
  const filIds = [
    ...new Set(
      [...(classesRaw ?? []), ...(modulesRaw ?? [])]
        .map((x) => x.filiere_id)
        .filter(Boolean) as string[]
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
    moduleLabel.set(
      m.id,
      `${m.name}${m.level ? ` (${m.level})` : ""}${m.filiere_id ? ` — ${filName.get(m.filiere_id) ?? "?"}` : ""}`
    );

  const options: StaffingOptions = {
    years: (years ?? []).map((y) => ({ value: y.year, active: y.status === "active" })),
    classes: (classesRaw ?? []).map((c) => ({ id: c.id, label: classLabel.get(c.id) ?? c.name })),
    modules: (modulesRaw ?? []).map((m) => ({ id: m.id, label: moduleLabel.get(m.id) ?? m.name })),
  };

  const drafts = requests.filter((r) => r.status === "brouillon");
  const others = requests.filter((r) => r.status !== "brouillon");

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Besoins en personnel
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Exprimez un besoin (enseignant, assistant, personnel…) et suivez son traitement.
            La <strong>décision, l&apos;affectation et le recrutement</strong> relèvent de
            l&apos;<strong>Administrateur Général</strong> — ici vous préparez, soumettez et
            suivez.
          </p>

          {/* Création */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold text-ipmd-black">Nouveau besoin</h2>
            <p className="mt-0.5 mb-3 text-xs text-black/50">
              Enregistré en brouillon : modifiable tant qu&apos;il n&apos;est pas soumis.
            </p>
            <StaffingRequestForm mode="create" options={options} />
          </div>

          {/* Brouillons */}
          {drafts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ipmd-black">
                Brouillons <span className="text-black/40">({drafts.length})</span>
              </h2>
              <ul className="mt-3 space-y-3">
                {drafts.map((r) => (
                  <StaffingDraftCard key={r.id} request={r} options={options} />
                ))}
              </ul>
            </div>
          )}

          {/* Besoins soumis / traités (lecture seule) */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ipmd-black">
              Besoins transmis <span className="text-black/40">({others.length})</span>
            </h2>
            {others.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun besoin transmis pour l&apos;instant.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {others.map((r) => {
                  const badge = STAFFING_STATUS[r.status];
                  return (
                    <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
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
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}
                        >
                          {badge?.label ?? r.status}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{r.justification}</p>

                      {/* Suivi de l'état (lecture) */}
                      <div className="mt-3 border-t border-black/5 pt-3 text-xs text-black/55">
                        {r.status === "en_attente" && <p>⏳ En attente de la décision de l&apos;AG.</p>}
                        {r.status === "validee" && <p>✅ Validée le {fmt(r.decided_at)}. En attente d&apos;affectation par l&apos;AG.</p>}
                        {r.status === "refusee" && (
                          <p className="text-ipmd-red">
                            ✖ Refusée le {fmt(r.decided_at)}
                            {r.decision_reason ? ` — motif : ${r.decision_reason}` : ""}.
                          </p>
                        )}
                        {r.status === "affectee" && (
                          <p>👤 Affectée à <strong>{r.assigned_profile_name ?? "—"}</strong> le {fmt(r.assigned_at)}.</p>
                        )}
                        {r.status === "cloturee" && (
                          <p>
                            🏁 Clôturée le {fmt(r.closed_at)}.
                            {r.assigned_profile_name ? ` Personne affectée : ${r.assigned_profile_name}.` : ""}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
