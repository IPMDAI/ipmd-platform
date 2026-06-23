import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { TeacherContract } from "@/components/espace/documents/TeacherContract";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { matricule } from "@/lib/documents";
import { signDoc, verifyUrl } from "@/lib/doc-verify";

export const metadata: Metadata = {
  title: "Contrat de vacataire",
};

const STAFF = ["admin", "super_admin", "pedagogie"];

/** Année académique par défaut (1er oct → 31 juil). */
function defaultAcademic(): { start: string; end: string } {
  const d = new Date();
  const y = d.getUTCMonth() >= 9 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return { start: `${y}-10-01`, end: `${y + 1}-07-31` };
}
function frLong(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ContratPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { teacherId } = await params;
  const { start: spStart, end: spEnd } = await searchParams;
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
      .select(
        "phone, function, title, specialty, diplomas, civilite, prenoms, type_piece, num_piece, nationalite, date_naissance, situation_matrimoniale, pays_residence, ville_residence, diploma_date, diploma_school, emergency_name, emergency_phone"
      )
      .eq("teacher_id", teacherId)
      .maybeSingle(),
    supabase
      .from("teacher_pay")
      .select("hourly_rate")
      .eq("teacher_id", teacherId)
      .maybeSingle(),
  ]);
  if (!prof) notFound();

  const def = defaultAcademic();
  const start = spStart || def.start;
  const end = spEnd || def.end;
  const startLabel = frLong(start);
  const endLabel = frLong(end);
  const name = prof.full_name || prof.email || "—";
  const verifyHref = verifyUrl(
    signDoc({
      t: "contrat",
      m: matricule(teacherId),
      n: name,
      y: `${startLabel} → ${endLabel}`,
    })
  );

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

          {/* Période du contrat (configurable) */}
          <form className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 print:hidden">
            <Field label="Début" htmlFor="start">
              <input id="start" name="start" type="date" defaultValue={start} className={inputBase} />
            </Field>
            <Field label="Fin" htmlFor="end">
              <input id="end" name="end" type="date" defaultValue={end} className={inputBase} />
            </Field>
            <ActionButton type="submit">Appliquer</ActionButton>
          </form>

          <div className="mt-6">
            <TeacherContract
              data={{
                name,
                email: prof.email,
                phone: sheet?.phone,
                function: sheet?.function,
                title: sheet?.title,
                specialty: sheet?.specialty,
                diplomas: sheet?.diplomas,
                hourlyRate: Number(pay?.hourly_rate ?? 0),
                startLabel,
                endLabel,
                verifyHref,
                civilite: sheet?.civilite,
                prenoms: sheet?.prenoms,
                typePiece: sheet?.type_piece,
                numPiece: sheet?.num_piece,
                nationalite: sheet?.nationalite,
                dateNaissance: sheet?.date_naissance ? frLong(sheet.date_naissance) : null,
                situation: sheet?.situation_matrimoniale,
                paysResidence: sheet?.pays_residence,
                villeResidence: sheet?.ville_residence,
                diplomaDate: sheet?.diploma_date ? frLong(sheet.diploma_date) : null,
                diplomaSchool: sheet?.diploma_school,
                emergencyName: sheet?.emergency_name,
                emergencyPhone: sheet?.emergency_phone,
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
