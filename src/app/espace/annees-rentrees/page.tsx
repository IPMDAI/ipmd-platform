import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  AnneesRentrees,
  type YearRow,
  type IntakeRow,
  type OfferingRow,
  type FiliereRow,
} from "@/components/espace/AnneesRentrees";

export const metadata: Metadata = {
  title: "Années & Rentrées",
};

const NON_DIPLOMA_LEVELS = ["Bootcamp", "Executive"];

export default async function AnneesRentreesPage() {
  const { supabase, role } = await requireAdmin();
  const isSuper = role === "super_admin";

  const [{ data: yearRows }, { data: intakeRows }, { data: offeringRows }, { data: classRows }, { data: filiereRows }, { data: levelRows }] =
    await Promise.all([
      supabase.from("academic_years").select("year, status, activated_at").order("year", { ascending: false }),
      supabase
        .from("intakes")
        .select("id, academic_year, label, start_date, applications_open_at, applications_close_at, status, sort_order")
        .order("academic_year", { ascending: false })
        .order("sort_order"),
      supabase.from("intake_offerings").select("id, intake_id, filiere_id, level, status"),
      supabase.from("classes").select("filiere_id, level, academic_year, intake_id").eq("kind", "diplome"),
      supabase.from("filieres").select("id, name, status").order("name"),
      supabase.from("tuition_levels").select("level, sort_order").order("sort_order"),
    ]);

  const years: YearRow[] = (yearRows ?? []).map((y) => ({
    year: y.year as string,
    status: y.status as string,
    activatedAt: (y.activated_at as string) ?? null,
  }));

  const filieres: FiliereRow[] = (filiereRows ?? [])
    .filter((f) => f.status !== "archive" && f.status !== "en_attente")
    .map((f) => ({ id: f.id as string, name: f.name as string }));
  const filiereName = new Map(filieres.map((f) => [f.id, f.name]));

  const levels = (levelRows ?? [])
    .map((l) => l.level as string)
    .filter((l) => !NON_DIPLOMA_LEVELS.includes(l));

  // Année de chaque rentrée + ensemble des cohortes réellement configurées.
  const intakeYear = new Map((intakeRows ?? []).map((i) => [i.id as string, i.academic_year as string]));
  const classSet = new Set(
    (classRows ?? [])
      .filter((c) => c.filiere_id && c.level && c.academic_year && c.intake_id)
      .map((c) => `${c.filiere_id}|${c.level}|${c.academic_year}|${c.intake_id}`)
  );

  const offeringsByIntake = new Map<string, OfferingRow[]>();
  for (const o of offeringRows ?? []) {
    const yr = intakeYear.get(o.intake_id as string) ?? "";
    const hasClass = classSet.has(`${o.filiere_id}|${o.level}|${yr}|${o.intake_id}`);
    const row: OfferingRow = {
      id: o.id as string,
      filiereId: o.filiere_id as string,
      filiereName: filiereName.get(o.filiere_id as string) ?? "(filière ?)",
      level: o.level as string,
      status: o.status as string,
      hasClass,
    };
    const arr = offeringsByIntake.get(o.intake_id as string) ?? [];
    arr.push(row);
    offeringsByIntake.set(o.intake_id as string, arr);
  }

  const intakes: IntakeRow[] = (intakeRows ?? []).map((i) => ({
    id: i.id as string,
    academicYear: i.academic_year as string,
    label: i.label as string,
    startDate: (i.start_date as string) ?? null,
    applicationsOpenAt: (i.applications_open_at as string) ?? null,
    applicationsCloseAt: (i.applications_close_at as string) ?? null,
    status: i.status as string,
    offerings: (offeringsByIntake.get(i.id as string) ?? []).sort((a, b) =>
      (a.filiereName + a.level).localeCompare(b.filiereName + b.level)
    ),
  }));

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-black text-ipmd-black sm:text-3xl">Années &amp; Rentrées</h1>
          <p className="mt-2 text-sm text-black/55">
            Gérez les années académiques (fonctionnement) et les rentrées ouvertes au recrutement.
            Le formulaire public de candidature ne proposera que les rentrées <strong>ouvertes</strong>.
          </p>
          <div className="mt-8">
            <AnneesRentrees
              years={years}
              intakes={intakes}
              filieres={filieres}
              levels={levels}
              isSuper={isSuper}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
