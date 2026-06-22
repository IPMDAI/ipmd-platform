import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  RecruitmentList,
  type Application,
} from "@/components/espace/RecruitmentList";

export const metadata: Metadata = {
  title: "Recrutement des enseignants",
};

export default async function RecrutementAdminPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("teacher_applications")
    .select(
      "id, full_name, email, phone, subject, availability, syllabus, cv_url, diploma_url, authorization_url, message, status, ai_summary, created_at"
    )
    .order("created_at", { ascending: false });

  const applications = (rows ?? []) as Application[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <div className="mt-3 flex items-baseline gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              Recrutement des enseignants
            </h1>
            <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
              {applications.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-black/55">
            Candidatures reçues. Changez le statut et lancez l&apos;analyse IA du
            syllabus.
          </p>

          <div className="mt-8">
            <RecruitmentList applications={applications} />
          </div>
        </div>
      </Container>
    </section>
  );
}
