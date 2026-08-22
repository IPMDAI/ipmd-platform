import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { loadStudentReenrollment } from "@/lib/student-reenrollment";
import { StudentReenrollment } from "@/components/espace/StudentReenrollment";

export const metadata: Metadata = {
  title: "Ma réinscription 2026-2027",
};

/**
 * Phase B — écran étudiant « Ma réinscription 2026-2027 ».
 * Visible s'il existe un dossier `reenrollments` 'prepared' pour l'étudiant
 * connecté. `loadStudentReenrollment` passe par `requireUser` (redirige si non
 * connecté). Aucune validation finale ni bascule de classe ici.
 */
export default async function MaReinscriptionPage() {
  const data = await loadStudentReenrollment();

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-black text-ipmd-black sm:text-3xl">Ma réinscription 2026-2027</h1>

          {data ? (
            <>
              <p className="mt-2 text-sm text-black/55">
                Vérifiez vos informations et le passage proposé, acceptez le règlement et l'avenant,
                puis confirmez. Votre passage devient effectif après validation par l'administration.
              </p>
              <div className="mt-8">
                <StudentReenrollment data={data} />
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-3xl" aria-hidden="true">🗓️</p>
              <p className="mt-2 text-sm font-semibold text-ipmd-black">
                Aucune réinscription à confirmer pour le moment.
              </p>
              <p className="mt-1 text-[13px] text-black/55">
                Votre dossier de réinscription 2026-2027 n'est pas encore préparé, ou il a déjà été traité.
              </p>
              <Link href="/espace" className="mt-4 inline-block rounded-full bg-black/5 px-4 py-2 text-xs font-semibold text-ipmd-black hover:bg-black/10">
                Retour à mon espace
              </Link>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
