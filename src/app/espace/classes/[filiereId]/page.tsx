import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { NewModuleForm } from "@/components/espace/NewModuleForm";
import { deleteModule } from "@/lib/referentiel-actions";
import { NIVEAUX, SEMESTERS, LEVEL_PHASE, CURRENT_ACADEMIC_YEAR } from "@/lib/referentiel";

export const metadata: Metadata = {
  title: "Maquette de la filière",
};

type Mod = {
  id: string;
  name: string;
  level: string | null;
  semester: string | null;
  heures_cours: number | null;
  heures_td: number | null;
  heures_tp: number | null;
  heures_projet: number | null;
  credits: number | null;
  ue_id: string | null;
};
type Ue = { id: string; code: string; name: string; level: string | null; semester: string | null };

const prog = (m: Mod) =>
  (m.heures_cours ?? 0) + (m.heures_td ?? 0) + (m.heures_tp ?? 0) + (m.heures_projet ?? 0);

export default async function FiliereModulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ filiereId: string }>;
  searchParams: Promise<{ annee?: string }>;
}) {
  const { filiereId } = await params;
  const { annee } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: filiere } = await supabase
    .from("filieres")
    .select("id, name")
    .eq("id", filiereId)
    .single();
  if (!filiere) notFound();

  // Années de maquette disponibles (la maquette est versionnée par année).
  const { data: yearRows } = await supabase
    .from("modules")
    .select("academic_year")
    .eq("filiere_id", filiereId);
  const years = [
    ...new Set((yearRows ?? []).map((y) => y.academic_year as string).filter(Boolean)),
  ].sort().reverse();
  const year =
    annee && years.includes(annee)
      ? annee
      : years.includes(CURRENT_ACADEMIC_YEAR)
      ? CURRENT_ACADEMIC_YEAR
      : years[0] ?? CURRENT_ACADEMIC_YEAR;

  const [{ data: modRows }, { data: ueRows }, { data: cfg }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, name, level, semester, heures_cours, heures_td, heures_tp, heures_projet, credits, ue_id")
      .eq("filiere_id", filiereId)
      .eq("academic_year", year)
      .order("name"),
    supabase
      .from("unites_enseignement")
      .select("id, code, name, level, semester")
      .eq("filiere_id", filiereId)
      .eq("academic_year", year)
      .order("code"),
    supabase
      .from("academic_year_config")
      .select("hours_per_credit")
      .eq("academic_year", year)
      .maybeSingle(),
  ]);
  const modules = (modRows ?? []) as Mod[];
  const ues = (ueRows ?? []) as Ue[];
  const factor = Number(cfg?.hours_per_credit ?? 0);

  const ueById = new Map(ues.map((u) => [u.id, u]));

  // Structure : niveau → semestre → (ue_id | "none") → modules.
  const tree = new Map<string, Map<string, Map<string, Mod[]>>>();
  for (const m of modules) {
    const lvl = m.level ?? "Autres";
    const sem = m.semester ?? "—";
    const uek = m.ue_id ?? "none";
    if (!tree.has(lvl)) tree.set(lvl, new Map());
    const semMap = tree.get(lvl)!;
    if (!semMap.has(sem)) semMap.set(sem, new Map());
    const ueMap = semMap.get(sem)!;
    if (!ueMap.has(uek)) ueMap.set(uek, []);
    ueMap.get(uek)!.push(m);
  }
  const levelOrder = [...NIVEAUX, "Autres"].filter((l) => tree.has(l));
  const semOrder = [...SEMESTERS, "—"];
  const sumCredits = (ms: Mod[]) => ms.reduce((a, m) => a + (m.credits ?? 0), 0);
  const sumProg = (ms: Mod[]) => ms.reduce((a, m) => a + prog(m), 0);

  const cell = "px-2 py-1.5 text-center tabular-nums";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/espace/classes"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Classes &amp; filières
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Maquette — {filiere.name}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Programme LMD par Unité d&apos;Enseignement — année <strong>{year}</strong>.
          </p>

          {years.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-black/45">Année :</span>
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/espace/classes/${filiereId}?annee=${y}`}
                  className={`rounded-full px-3 py-1 text-xs font-bold ring-1 transition-colors ${
                    y === year
                      ? "bg-ipmd-black text-white ring-ipmd-black"
                      : "bg-white text-black/60 ring-black/10 hover:ring-ipmd-red/40"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="order-2 lg:order-1 space-y-8">
              {modules.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun module pour cette année. Ajoutez-en un →
                </p>
              ) : (
                levelOrder.map((lvl) => {
                  const semMap = tree.get(lvl)!;
                  const sems = semOrder.filter((s) => semMap.has(s));
                  const levelCredits = sems.reduce(
                    (a, s) => a + sumCredits([...semMap.get(s)!.values()].flat()),
                    0
                  );
                  return (
                    <div key={lvl}>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold uppercase tracking-wide text-ipmd-red">
                          {lvl}
                        </h3>
                        {LEVEL_PHASE[lvl] && (
                          <span className="rounded-full bg-ipmd-black px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {LEVEL_PHASE[lvl]}
                          </span>
                        )}
                        {levelCredits > 0 && (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                            {levelCredits} crédits
                          </span>
                        )}
                      </div>

                      <div className="space-y-5">
                        {sems.map((sem) => {
                          const ueMap = semMap.get(sem)!;
                          const allMods = [...ueMap.values()].flat();
                          const semCredits = sumCredits(allMods);
                          const semProg = sumProg(allMods);
                          const charge = factor > 0 ? semCredits * factor : 0;
                          // UE ordonnées par code, puis le bucket "Hors UE".
                          const ueKeys = [...ueMap.keys()]
                            .filter((k) => k !== "none")
                            .sort((a, b) => (ueById.get(a)?.code ?? "").localeCompare(ueById.get(b)?.code ?? ""));
                          return (
                            <div
                              key={sem}
                              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-ipmd-light px-4 py-2.5">
                                <p className="text-sm font-bold text-ipmd-black">{sem}</p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                  <span className="rounded-full bg-white px-2 py-0.5 text-black/60 ring-1 ring-black/10">
                                    {semProg} h prog.
                                  </span>
                                  {charge > 0 && (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-black/60 ring-1 ring-black/10">
                                      {charge} h charge
                                    </span>
                                  )}
                                  <span className={`rounded-full px-2 py-0.5 ${semCredits === 30 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                    {semCredits} crédits
                                  </span>
                                </div>
                              </div>

                              {ueKeys.map((uek) => {
                                const ue = ueById.get(uek)!;
                                const ms = ueMap.get(uek)!;
                                return (
                                  <div key={uek} className="border-b border-black/5 last:border-0">
                                    <div className="flex items-center justify-between gap-2 bg-black/[0.02] px-4 py-2">
                                      <p className="text-xs font-bold text-ipmd-black">
                                        <span className="text-ipmd-red">{ue.code}</span> — {ue.name}
                                      </p>
                                      <p className="shrink-0 text-[11px] font-semibold text-black/50">
                                        {sumProg(ms)} h · {sumCredits(ms)} cr
                                      </p>
                                    </div>
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-[10px] uppercase tracking-wide text-black/40">
                                          <th className="px-2 py-1 text-left font-semibold">Module</th>
                                          <th className={cell}>C</th>
                                          <th className={cell}>TD</th>
                                          <th className={cell}>TP</th>
                                          <th className={cell}>Proj</th>
                                          <th className={cell}>H</th>
                                          <th className={cell}>Cr</th>
                                          <th className="px-2 py-1"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-black/5">
                                        {ms.map((m) => (
                                          <tr key={m.id}>
                                            <td className="px-2 py-1.5">
                                              <Link
                                                href={`/espace/module/${m.id}`}
                                                className="font-medium text-ipmd-black transition-colors hover:text-ipmd-red"
                                              >
                                                {m.name}
                                              </Link>
                                            </td>
                                            <td className={cell}>{m.heures_cours ?? "—"}</td>
                                            <td className={cell}>{m.heures_td ?? "—"}</td>
                                            <td className={cell}>{m.heures_tp ?? "—"}</td>
                                            <td className={cell}>{m.heures_projet ?? "—"}</td>
                                            <td className={`${cell} font-semibold`}>{prog(m)}</td>
                                            <td className={`${cell} font-bold text-ipmd-black`}>{m.credits ?? "—"}</td>
                                            <td className="px-2 py-1.5 text-right">
                                              <form action={deleteModule.bind(null, filiereId, m.id)}>
                                                <button
                                                  type="submit"
                                                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                                                >
                                                  Suppr.
                                                </button>
                                              </form>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })}

                              {/* Modules pas encore rattachés à une UE (semestre non structuré). */}
                              {ueMap.has("none") && (
                                <div className="border-t border-black/5">
                                  <div className="bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
                                    Hors UE — à structurer (crédits/UE non attribués)
                                  </div>
                                  <ul className="divide-y divide-black/5">
                                    {ueMap.get("none")!.map((m) => (
                                      <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                        <Link
                                          href={`/espace/module/${m.id}`}
                                          className="min-w-0 flex-1 text-xs font-medium text-ipmd-black transition-colors hover:text-ipmd-red"
                                        >
                                          {m.name}
                                        </Link>
                                        <form action={deleteModule.bind(null, filiereId, m.id)}>
                                          <button
                                            type="submit"
                                            className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                                          >
                                            Suppr.
                                          </button>
                                        </form>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="order-1 lg:order-2">
              <NewModuleForm filiereId={filiereId} academicYear={year} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
