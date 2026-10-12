import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { NewModuleForm } from "@/components/espace/NewModuleForm";
import { deleteModule } from "@/lib/referentiel-actions";
import { NIVEAUX, SEMESTERS, LEVEL_PHASE, CURRENT_ACADEMIC_YEAR } from "@/lib/referentiel";

export const metadata: Metadata = {
  title: "Modules de la filière",
};

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

  // Années de maquette disponibles pour cette filière (sélecteur). La maquette
  // est versionnée par année : on ne lit QUE l'année active.
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

  const { data: rows } = await supabase
    .from("modules")
    .select("id, name, level, semester")
    .eq("filiere_id", filiereId)
    .eq("academic_year", year)
    .order("created_at");
  const modules = rows ?? [];

  // Regroupe par niveau → semestre.
  type Mod = { id: string; name: string };
  const grouped = new Map<string, Map<string, Mod[]>>();
  for (const m of modules) {
    const lvl = m.level ?? "Autres";
    const sem = m.semester ?? "—";
    if (!grouped.has(lvl)) grouped.set(lvl, new Map());
    const semMap = grouped.get(lvl)!;
    if (!semMap.has(sem)) semMap.set(sem, []);
    semMap.get(sem)!.push({ id: m.id, name: m.name });
  }
  const levelOrder = [...NIVEAUX, "Autres"].filter((l) => grouped.has(l));
  const semOrder = [...SEMESTERS, "—"];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace/classes"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Classes &amp; filières
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Modules — {filiere.name}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Les modules (matières) enseignés dans cette filière — maquette{" "}
            <strong>{year}</strong>.
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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">Modules</h2>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
                  {modules.length}
                </span>
              </div>

              {modules.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun module. Ajoutez-en un →
                </p>
              ) : (
                <div className="space-y-6">
                  {levelOrder.map((lvl) => {
                    const semMap = grouped.get(lvl)!;
                    const sems = semOrder.filter((s) => semMap.has(s));
                    return (
                      <div key={lvl}>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold uppercase tracking-wide text-ipmd-red">
                            {lvl}
                          </h3>
                          {LEVEL_PHASE[lvl] && (
                            <span className="rounded-full bg-ipmd-black px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {LEVEL_PHASE[lvl]}
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {sems.map((sem) => (
                            <div
                              key={sem}
                              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                            >
                              <p className="border-b border-black/5 bg-ipmd-light px-4 py-2 text-xs font-bold text-black/55">
                                {sem}
                              </p>
                              <ul className="divide-y divide-black/5">
                                {semMap.get(sem)!.map((m) => (
                                  <li
                                    key={m.id}
                                    className="flex items-center justify-between gap-3 px-4 py-3"
                                  >
                                    <Link
                                      href={`/espace/module/${m.id}`}
                                      className="min-w-0 flex-1 font-medium text-ipmd-black transition-colors hover:text-ipmd-red"
                                    >
                                      {m.name}
                                    </Link>
                                    <form
                                      action={deleteModule.bind(
                                        null,
                                        filiereId,
                                        m.id
                                      )}
                                    >
                                      <button
                                        type="submit"
                                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                                      >
                                        Supprimer
                                      </button>
                                    </form>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
