import type { Metadata } from "next";
import Link from "next/link";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { MilestoneForm, type Milestone } from "@/components/espace/MilestoneForm";
import { DeleteMilestoneButton } from "@/components/espace/DeleteMilestoneButton";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/referentiel";
import { CALENDAR_KIND_LABEL } from "@/lib/schedule";

export const metadata: Metadata = { title: "Calendrier académique" };

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const { annee } = await searchParams;
  const { supabase } = await requireAcademic();

  const { data: yearRows } = await supabase.from("academic_calendar").select("academic_year");
  const years = [
    ...new Set([
      CURRENT_ACADEMIC_YEAR,
      ...((yearRows ?? []).map((y) => y.academic_year as string)),
    ]),
  ].sort().reverse();
  const year = annee && years.includes(annee) ? annee : CURRENT_ACADEMIC_YEAR;

  const { data: rows } = await supabase
    .from("academic_calendar")
    .select("id, academic_year, kind, label, start_date, end_date, level, blocks_regular, blocks_all")
    .eq("academic_year", year)
    .order("start_date");
  const milestones = (rows ?? []) as Milestone[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Calendrier académique
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Jalons et périodes de l&apos;année — examens, présentations, soutenances, vacances, stages.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-black/45">Année :</span>
            {years.map((y) => (
              <Link
                key={y}
                href={`/espace/calendrier?annee=${y}`}
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 transition-colors ${
                  y === year ? "bg-ipmd-black text-white ring-ipmd-black" : "bg-white text-black/60 ring-black/10 hover:ring-ipmd-red/40"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {milestones.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun jalon pour {year}. Ajoutez-en un →
                </p>
              ) : (
                <ul className="space-y-3">
                  {milestones.map((m) => (
                    <li key={m.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-ipmd-black">{m.label}</p>
                          <p className="text-xs text-black/55">
                            {CALENDAR_KIND_LABEL[m.kind] ?? m.kind}
                            {m.level ? ` · ${m.level}` : ""} · {frDate(m.start_date)} → {frDate(m.end_date)}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.blocks_all && (
                              <span className="rounded-full bg-ipmd-red/10 px-2 py-0.5 text-[10px] font-bold text-ipmd-red">
                                Fermeture totale
                              </span>
                            )}
                            {m.blocks_regular && !m.blocks_all && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Cours réguliers suspendus
                              </span>
                            )}
                          </div>
                        </div>
                        <DeleteMilestoneButton id={m.id} label={m.label} />
                      </div>
                      <details className="mt-2 group">
                        <summary className="cursor-pointer text-[11px] font-semibold text-ipmd-red">
                          Modifier
                        </summary>
                        <div className="mt-2">
                          <MilestoneForm year={year} milestone={m} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <MilestoneForm year={year} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
