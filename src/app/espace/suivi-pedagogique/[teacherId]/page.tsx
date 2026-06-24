import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { Cachet } from "@/components/espace/documents/Cachet";

export const metadata: Metadata = { title: "Suivi pédagogique" };

const STAFF = ["super_admin", "admin", "pedagogie"];

function hours(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const p = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const d = p(end) - p(start);
  return d > 0 ? Math.round((d / 60) * 100) / 100 : 0;
}

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function SuiviPedagogiquePage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ discipline?: string; niveau?: string }>;
}) {
  const { teacherId } = await params;
  const sp = await searchParams;
  const { supabase, userId } = await requireUser();

  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isStaff = STAFF.includes(me?.role ?? "");
  if (teacherId !== userId && !isStaff) redirect("/espace");

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", teacherId)
    .single();
  if (!teacher) notFound();

  const [{ data: sheet }, { data: sessions }] = await Promise.all([
    supabase.from("teacher_profiles").select("function").eq("teacher_id", teacherId).maybeSingle(),
    supabase
      .from("course_sessions")
      .select("id, subject, class_id, session_date, start_time, end_time")
      .eq("teacher_id", teacherId)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const allSessions = sessions ?? [];
  const classIds = [...new Set(allSessions.map((s) => s.class_id).filter(Boolean))];
  const sessionIds = allSessions.map((s) => s.id);

  const [{ data: classes }, { data: reports }] = await Promise.all([
    classIds.length
      ? supabase.from("classes").select("id, name, level").in("id", classIds)
      : Promise.resolve({ data: [] as { id: string; name: string; level: string | null }[] }),
    sessionIds.length
      ? supabase
          .from("session_reports")
          .select("session_id, content, supports, homework, actual_start, actual_end")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
  const reportMap = new Map((reports ?? []).map((r) => [r.session_id as string, r]));

  // Options de filtre (disciplines + niveaux de l'enseignant).
  const disciplines = [...new Set(allSessions.map((s) => s.subject).filter(Boolean))].sort();
  const niveaux = [...new Set(allSessions.map((s) => classMap.get(s.class_id)?.level).filter(Boolean))].sort() as string[];

  let shown = allSessions;
  if (sp.discipline) shown = shown.filter((s) => s.subject === sp.discipline);
  if (sp.niveau) shown = shown.filter((s) => classMap.get(s.class_id)?.level === sp.niveau);

  const rows = shown.map((s, i) => {
    const r = reportMap.get(s.id);
    const h =
      hours(r?.actual_start as string, r?.actual_end as string) ||
      hours(s.start_time, s.end_time);
    return {
      n: i + 1,
      date: s.session_date,
      hours: h,
      discipline: s.subject,
      classe: classMap.get(s.class_id)?.name ?? "—",
      themes: (r?.content as string) ?? "",
      documents: (r?.supports as string) ?? "",
      travaux: (r?.homework as string) ?? "",
    };
  });
  const totalHours = Math.round(rows.reduce((a, r) => a + r.hours, 0) * 100) / 100;

  const sel = "rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-ipmd-black";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link
              href={isStaff ? "/espace/enseignants" : "/espace"}
              className="text-sm font-semibold text-black/50 hover:text-ipmd-red"
            >
              ← Retour
            </Link>
            <PrintButton />
          </div>

          {/* Filtres */}
          <form className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-black/40">Filtrer :</span>
            <select name="discipline" defaultValue={sp.discipline ?? ""} className={sel}>
              <option value="">Toutes les disciplines</option>
              {disciplines.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select name="niveau" defaultValue={sp.niveau ?? ""} className={sel}>
              <option value="">Tous les niveaux</option>
              {niveaux.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-semibold text-white">
              Appliquer
            </button>
            {(sp.discipline || sp.niveau) && (
              <Link href={`/espace/suivi-pedagogique/${teacherId}`} className="text-sm font-semibold text-ipmd-red hover:underline">
                Réinitialiser
              </Link>
            )}
          </form>

          {/* Document */}
          <article className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0">
            <header className="border-b border-black/10 pb-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src="/logo-ipmd.png" alt="IPMD" width={48} height={48} className="h-full w-full object-contain" />
                </span>
                <p className="text-sm font-extrabold uppercase tracking-wide text-ipmd-black">
                  Institut Polytechnique des Métiers du Digital
                </p>
              </div>
              <p className="mt-2 text-xl font-extrabold uppercase tracking-wide text-ipmd-black">
                Suivi pédagogique
              </p>
            </header>

            {/* Identité intervenant */}
            <div className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <p><span className="text-black/50">Intervenant : </span><span className="font-bold text-ipmd-black">{teacher.full_name || teacher.email}</span>{sheet?.function ? <span className="text-black/55"> — {sheet.function}</span> : null}</p>
              <p><span className="text-black/50">Discipline : </span><span className="font-semibold text-ipmd-black">{sp.discipline || "Toutes"}</span></p>
              <p><span className="text-black/50">Niveau d&apos;étude : </span><span className="font-semibold text-ipmd-black">{sp.niveau || "Tous"}</span></p>
              <p><span className="text-black/50">Volume horaire effectué : </span><span className="font-bold text-ipmd-black">{totalHours} h</span> <span className="text-black/40">({rows.length} séance{rows.length > 1 ? "s" : ""})</span></p>
            </div>

            {/* Tableau */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-ipmd-light text-left text-[10px] uppercase tracking-wider text-black/50">
                    <th className="border border-black/10 px-2 py-2 font-bold">Séance N°</th>
                    <th className="border border-black/10 px-2 py-2 font-bold">Date</th>
                    <th className="border border-black/10 px-2 py-2 font-bold">Nb&nbsp;h</th>
                    <th className="border border-black/10 px-2 py-2 font-bold">Discipline / Classe</th>
                    <th className="border border-black/10 px-2 py-2 font-bold">Travaux</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="border border-black/10 px-2 py-6 text-center text-black/45">Aucune séance.</td></tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.n} className="align-top">
                        <td className="border border-black/10 px-2 py-2 text-center font-semibold">{r.n}</td>
                        <td className="border border-black/10 px-2 py-2 whitespace-nowrap">{frDate(r.date)}</td>
                        <td className="border border-black/10 px-2 py-2 text-center">{r.hours || "—"}</td>
                        <td className="border border-black/10 px-2 py-2 text-black/70">
                          {r.discipline}
                          <span className="block text-[10px] text-black/40">{r.classe}</span>
                        </td>
                        <td className="border border-black/10 px-2 py-2 text-black/75">
                          <p><span className="font-semibold text-black/55">Thèmes abordés :</span> {r.themes || "—"}</p>
                          <p className="mt-1"><span className="font-semibold text-black/55">Documents distribués :</span> {r.documents || "—"}</p>
                          <p className="mt-1"><span className="font-semibold text-black/55">Travaux demandés (écrit/oral) :</span> {r.travaux || "—"}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature */}
            <div className="mt-8 flex items-end justify-between gap-6">
              <p className="text-[11px] text-black/45">
                Document généré par l&apos;IPMD · ipmd.pro
              </p>
              <div className="text-center">
                <p className="text-xs text-black/60">L&apos;intervenant</p>
                <div className="mt-2 flex h-12 items-center justify-center"><Cachet size={64} /></div>
                <div className="mt-1 w-44 border-b border-black/30" />
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
