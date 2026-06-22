import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { BulletinView } from "@/components/espace/BulletinView";
import { PrintButton } from "@/components/espace/PrintButton";

export const metadata: Metadata = {
  title: "Bulletin",
};

export default async function BulletinPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ sem?: string }>;
}) {
  const { studentId } = await params;
  const { sem } = await searchParams;
  const { supabase } = await requireUser();

  // La RLS ne renvoie le profil que si l'utilisateur est autorisé
  // (l'étudiant lui-même, son parent, ou un admin).
  const { data: student } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const name = student.full_name || student.email || "—";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link
              href="/espace"
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              ← Retour à l&apos;espace
            </Link>
            <PrintButton />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black print:hidden">
            Bulletin — {name}
          </h1>

          <div className="mt-6">
            <BulletinView
              studentId={studentId}
              studentName={name}
              basePath={`/espace/bulletin/${studentId}`}
              selectedSemester={sem}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
