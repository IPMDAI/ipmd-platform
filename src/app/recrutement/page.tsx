import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { TeacherApplicationForm } from "@/components/forms/TeacherApplicationForm";

export const metadata: Metadata = {
  title: "Enseigner à l'IPMD",
  description:
    "Rejoignez le corps enseignant de l'IPMD. Pédagogie 80 % pratique, à l'ère de l'IA.",
};

export default function RecrutementPage() {
  return (
    <section className="bg-ipmd-light">
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-ipmd-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ipmd-red">
              Recrutement
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ipmd-black sm:text-4xl">
              Enseigner à l&apos;IPMD
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-black/60">
              Vous êtes expert·e du digital et passionné·e par la transmission ?
              Rejoignez une pédagogie <strong>80 % pratique</strong>, orientée
              projets et à l&apos;ère de l&apos;IA. Déposez votre candidature
              ci-dessous.
            </p>
          </div>

          <div className="mt-10">
            <TeacherApplicationForm />
          </div>

          <p className="mt-6 text-center text-sm text-black/45">
            Une question ? Écrivez-nous à{" "}
            <a
              href="mailto:recrutement@ipmd.pro"
              className="font-semibold text-ipmd-red"
            >
              recrutement@ipmd.pro
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}
