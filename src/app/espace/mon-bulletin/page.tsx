import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { BulletinView } from "@/components/espace/BulletinView";
import { PrintButton } from "@/components/espace/PrintButton";

export const metadata: Metadata = {
  title: "Mon bulletin",
};

export default async function MonBulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>;
}) {
  const { sem } = await searchParams;
  const { supabase, userId } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();
  let className: string | null = null;
  if (member?.class_id) {
    const { data: klass } = await supabase
      .from("classes")
      .select("name")
      .eq("id", member.class_id)
      .single();
    className = klass?.name ?? null;
  }

  const name = profile?.full_name || profile?.email || "—";

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
            Mon bulletin
          </h1>

          <div className="mt-6">
            <BulletinView
              studentId={userId}
              studentName={name}
              className={className}
              basePath="/espace/mon-bulletin"
              selectedSemester={sem}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
