import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/sections/PageHero";
import {
  distinguishedStudents,
  levelRank,
  type DistinguishedStudent,
} from "@/data/distingues";

export const metadata: Metadata = {
  title: "Tableau d'honneur — Nos étudiants distingués | IPMD",
  description:
    "L'IPMD met à l'honneur ses meilleurs étudiants, par année, niveau et filière.",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Carte d'un étudiant distingué. */
function StudentCard({ student }: { student: DistinguishedStudent }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ipmd-red/10 text-base font-bold text-ipmd-red">
        {student.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
        ) : (
          initials(student.name)
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-ipmd-black">{student.name}</p>
        <p className="text-sm font-semibold text-ipmd-red">{student.filiere}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-black/55">
          {student.mention && <span className="font-semibold text-ipmd-black">🏅 {student.mention}</span>}
          {student.average && <span>{student.average}</span>}
        </div>
        {student.note && <p className="mt-1 text-xs italic text-black/50">{student.note}</p>}
      </div>
    </div>
  );
}

export default function DistinguesPage() {
  // Regroupement : année (récente d'abord) → niveau (ordre défini) → filière.
  const years = [...new Set(distinguishedStudents.map((s) => s.year))].sort().reverse();

  return (
    <>
      <PageHero
        eyebrow="Tableau d'honneur"
        title="Nos étudiants distingués"
        description="L'IPMD met à l'honneur ses meilleurs étudiants — classés par année, par niveau et par filière."
      />

      <section className="bg-ipmd-light py-16 sm:py-24">
        <Container>
          {distinguishedStudents.length === 0 ? (
            <p className="text-center text-black/50">
              Le tableau d&apos;honneur sera bientôt publié. 🎓
            </p>
          ) : (
            <div className="space-y-16">
              {years.map((year) => {
                const yearStudents = distinguishedStudents.filter((s) => s.year === year);
                const levels = [...new Set(yearStudents.map((s) => s.level))].sort(
                  (a, b) => levelRank(a) - levelRank(b),
                );
                return (
                  <div key={year}>
                    <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
                      Promotion {year}
                    </h2>
                    <div className="mt-8 space-y-10">
                      {levels.map((level) => {
                        const levelStudents = yearStudents
                          .filter((s) => s.level === level)
                          .sort(
                            (a, b) =>
                              a.filiere.localeCompare(b.filiere) ||
                              a.name.localeCompare(b.name),
                          );
                        return (
                          <div key={level}>
                            <h3 className="mb-4 inline-block rounded-full bg-ipmd-black px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
                              {level}
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {levelStudents.map((s) => (
                                <StudentCard key={s.id} student={s} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
