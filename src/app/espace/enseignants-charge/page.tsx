import type { Metadata } from "next";
import Link from "next/link";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  TEACHER_STATUS_BADGE,
  SESSION_NOT_HELD,
  hoursBetween,
  slotsOverlap,
  type PedagogicalTeacher,
} from "@/lib/pedagogy";

export const metadata: Metadata = { title: "Enseignants & charge" };

/**
 * D7-1 — Pilotage pédagogique (LECTURE SEULE). Le DÉ (et admin/super/pedagogie)
 * voit, par enseignant : identité pédagogique (via RPC sécurisée, sans donnée
 * RH), modules affectés + heures prévues, classes, séances prévues/réalisées/
 * non tenues, volume réalisé, fiches manquantes, conflits de planning. AUCUNE
 * écriture, AUCUNE affectation (c'est D7-2). Aucun jugement « surcharge ».
 */
export default async function EnseignantsChargePage() {
  const { supabase } = await requireAcademic();

  // Annuaire pédagogique sécurisé (jamais de données RH/perso).
  const { data: teachersRaw } = await supabase.rpc("pedagogical_teachers");
  const teachers = (teachersRaw ?? []) as PedagogicalTeacher[];
  const ids = teachers.map((t) => t.profile_id);

  // Agrégats de charge — le DÉ a déjà le SELECT (D2) sur ces tables.
  type Mod = { id: string; name: string; level: string | null; filiere_id: string | null;
    heures_cours: number | null; heures_td: number | null; heures_tp: number | null;
    heures_projet: number | null; heures_stage: number | null; teacher_id: string };
  type Slot = { id: string; teacher_id: string; class_id: string | null; day_of_week: number;
    start_time: string; end_time: string; status: string | null };
  type Sess = { id: string; teacher_id: string; class_id: string | null; status: string | null;
    session_date: string; start_time: string | null; end_time: string | null };

  let modules: Mod[] = [];
  let slots: Slot[] = [];
  let sessions: Sess[] = [];
  let reports: { session_id: string; actual_start: string | null; actual_end: string | null }[] = [];
  const classMap = new Map<string, { name: string; level: string | null }>();
  const filMap = new Map<string, string>();

  if (ids.length > 0) {
    const [m, s, c] = await Promise.all([
      supabase.from("modules").select("id, name, level, filiere_id, heures_cours, heures_td, heures_tp, heures_projet, heures_stage, teacher_id").in("teacher_id", ids),
      supabase.from("timetable_slots").select("id, teacher_id, class_id, day_of_week, start_time, end_time, status").in("teacher_id", ids),
      supabase.from("course_sessions").select("id, teacher_id, class_id, status, session_date, start_time, end_time").in("teacher_id", ids),
    ]);
    modules = (m.data ?? []) as Mod[];
    slots = (s.data ?? []) as Slot[];
    sessions = (c.data ?? []) as Sess[];

    const sessIds = sessions.map((x) => x.id);
    const classIds = [
      ...new Set([...slots.map((x) => x.class_id), ...sessions.map((x) => x.class_id)].filter(Boolean) as string[]),
    ];
    const [rep, cls] = await Promise.all([
      sessIds.length
        ? supabase.from("session_reports").select("session_id, actual_start, actual_end").in("session_id", sessIds)
        : Promise.resolve({ data: [] as typeof reports }),
      classIds.length
        ? supabase.from("classes").select("id, name, level, filiere_id").in("id", classIds)
        : Promise.resolve({ data: [] as { id: string; name: string; level: string | null; filiere_id: string | null }[] }),
    ]);
    reports = (rep.data ?? []) as typeof reports;
    for (const c2 of cls.data ?? []) classMap.set(c2.id, { name: c2.name, level: c2.level });
    const filIds = [...new Set((modules.map((x) => x.filiere_id)).filter(Boolean) as string[])];
    if (filIds.length > 0) {
      const { data: fils } = await supabase.from("filieres").select("id, name").in("id", filIds);
      for (const f of fils ?? []) filMap.set(f.id, f.name);
    }
  }

  const reportBySession = new Map(reports.map((r) => [r.session_id, r]));
  const today = new Date().toISOString().slice(0, 10);

  const cards = teachers.map((t) => {
    const tMods = modules.filter((m) => m.teacher_id === t.profile_id);
    const tSlots = slots.filter((s) => s.teacher_id === t.profile_id);
    const tSess = sessions.filter((s) => s.teacher_id === t.profile_id);

    const plannedHours =
      tMods.reduce(
        (a, m) =>
          a + (m.heures_cours ?? 0) + (m.heures_td ?? 0) + (m.heures_tp ?? 0) + (m.heures_projet ?? 0) + (m.heures_stage ?? 0),
        0
      ) || 0;

    const nPrevues = tSess.filter((s) => s.status === "prevue").length;
    const realisees = tSess.filter((s) => s.status === "realisee");
    const nNonTenues = tSess.filter((s) => s.status && SESSION_NOT_HELD.has(s.status)).length;

    const doneHours =
      Math.round(
        realisees.reduce((a, s) => {
          const r = reportBySession.get(s.id);
          return a + (hoursBetween(r?.actual_start, r?.actual_end) || hoursBetween(s.start_time, s.end_time));
        }, 0) * 100
      ) / 100;

    const remaining = plannedHours > 0 ? Math.round((plannedHours - doneHours) * 100) / 100 : null;

    // Fiches manquantes : séances réalisées passées sans rapport.
    const fichesManquantes = realisees.filter((s) => s.session_date <= today && !reportBySession.has(s.id)).length;

    // Conflits de planning : créneaux prévus qui se chevauchent (même enseignant).
    const active = tSlots.filter((s) => s.status === "prevu" || s.status == null);
    let conflits = 0;
    for (let i = 0; i < active.length; i++)
      for (let j = i + 1; j < active.length; j++)
        if (slotsOverlap(active[i], active[j])) conflits++;

    const classIds = [...new Set([...tSlots, ...tSess].map((x) => x.class_id).filter(Boolean) as string[])];

    return {
      t,
      modCount: tMods.length,
      mods: tMods,
      classIds,
      plannedHours,
      doneHours,
      remaining,
      nPrevues,
      nRealisees: realisees.length,
      nNonTenues,
      fichesManquantes,
      conflits,
    };
  });

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Enseignants <span className="text-ipmd-red">&amp; charge</span>
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Pilotage pédagogique en <strong>lecture seule</strong> : modules, classes, volume
            horaire prévu/réalisé, séances et alertes factuelles. Les données RH (recrutement,
            fiche personnelle, paie) ne sont pas accessibles ici et l&apos;affectation se fera
            dans une étape dédiée.
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-black/40">
            {teachers.length} enseignant{teachers.length > 1 ? "s" : ""}
          </p>

          <div className="mt-3 space-y-3">
            {cards.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun enseignant à afficher pour l&apos;instant.
              </p>
            ) : (
              cards.map((c) => {
                const badge = c.t.statut ? TEACHER_STATUS_BADGE[c.t.statut] : null;
                return (
                  <div key={c.t.profile_id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    {/* Identité pédagogique */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-ipmd-black">{c.t.full_name || "—"}</p>
                        <p className="mt-0.5 text-sm text-black/55">
                          {c.t.fonction || "Fonction non renseignée"}
                          {c.t.specialite ? ` · ${c.t.specialite}` : ""}
                        </p>
                        {c.t.autorisation && (
                          <p className="mt-0.5 text-xs text-black/45">Autorisation : {c.t.autorisation}</p>
                        )}
                      </div>
                      {badge && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Charge factuelle */}
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Metric label="Modules" value={String(c.modCount)} />
                      <Metric label="Classes" value={String(c.classIds.length)} />
                      <Metric label="Vol. prévu" value={c.plannedHours > 0 ? `${c.plannedHours} h` : "—"} />
                      <Metric label="Vol. réalisé" value={`${c.doneHours} h`} />
                      <Metric label="Restant" value={c.remaining != null ? `${c.remaining} h` : "—"} />
                      <Metric label="Séances prévues" value={String(c.nPrevues)} />
                      <Metric label="Réalisées" value={String(c.nRealisees)} />
                      <Metric label="Non tenues" value={String(c.nNonTenues)} />
                    </div>

                    {/* Modules affectés */}
                    {c.mods.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.mods.map((m) => (
                          <span key={m.id} className="rounded-full bg-ipmd-light px-2 py-0.5 text-[11px] font-semibold text-ipmd-black">
                            {m.name}
                            {m.level ? ` · ${m.level}` : ""}
                            {m.filiere_id ? ` · ${filMap.get(m.filiere_id) ?? ""}` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Alertes FACTUELLES (aucun jugement de charge) */}
                    {(c.fichesManquantes > 0 || c.nNonTenues > 0 || c.conflits > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3 text-xs">
                        {c.fichesManquantes > 0 && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                            {c.fichesManquantes} fiche{c.fichesManquantes > 1 ? "s" : ""} de séance manquante{c.fichesManquantes > 1 ? "s" : ""}
                          </span>
                        )}
                        {c.nNonTenues > 0 && (
                          <span className="rounded-full bg-ipmd-red/10 px-2 py-0.5 font-semibold text-ipmd-red">
                            {c.nNonTenues} séance{c.nNonTenues > 1 ? "s" : ""} non tenue{c.nNonTenues > 1 ? "s" : ""}
                          </span>
                        )}
                        {c.conflits > 0 && (
                          <span className="rounded-full bg-ipmd-red/10 px-2 py-0.5 font-semibold text-ipmd-red">
                            {c.conflits} conflit{c.conflits > 1 ? "s" : ""} de planning
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ipmd-light px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className="text-sm font-bold text-ipmd-black">{value}</p>
    </div>
  );
}
