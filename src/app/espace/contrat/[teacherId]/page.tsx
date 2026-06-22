import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { TeacherContract } from "@/components/espace/documents/TeacherContract";

export const metadata: Metadata = {
  title: "Contrat de vacataire",
};

const STAFF = ["admin", "super_admin", "pedagogie"];

export default async function ContratPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [{ data: prof }, { data: sheet }, { data: pay }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", teacherId).single(),
    supabase
      .from("teacher_profiles")
      .select("phone, function, title, specialty, diplomas")
      .eq("teacher_id", teacherId)
      .maybeSingle(),
    supabase
      .from("teacher_pay")
      .select("hourly_rate")
      .eq("teacher_id", teacherId)
      .maybeSingle(),
  ]);
  if (!prof) notFound();

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link
              href="/espace/enseignants"
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              ← Enseignants
            </Link>
            <PrintButton />
          </div>

          <div className="mt-6">
            <TeacherContract
              data={{
                name: prof.full_name || prof.email || "—",
                email: prof.email,
                phone: sheet?.phone,
                function: sheet?.function,
                title: sheet?.title,
                specialty: sheet?.specialty,
                diplomas: sheet?.diplomas,
                hourlyRate: Number(pay?.hourly_rate ?? 0),
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
