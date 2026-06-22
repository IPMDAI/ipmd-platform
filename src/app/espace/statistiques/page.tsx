import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";
import { averageValue, mention } from "@/lib/grades";
import { CANDIDATURE_STATUSES, CANDIDATURE_LABEL } from "@/lib/candidatures";
import { universeNameById } from "@/data/universes";

export const metadata: Metadata = {
  title: "Statistiques",
};

export default async function StatistiquesPage() {
  const { supabase } = await requireAdmin();

  const headCount = (q: { count: number | null }) => q.count ?? 0;

  const [
    studentsC,
    teachersC,
    classesC,
    coursC,
    { data: members },
    { data: classes },
    { data: filieres },
    { data: payments },
    { data: finances },
    { data: attendance },
    { data: grades },
    { data: candidatures },
    { data: learners },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "etudiant"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "enseignant"),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("class_members").select("student_id, class_id"),
    supabase.from("classes").select("id, name, level, filiere_id"),
    supabase.from("filieres").select("id, name"),
    supabase.from("payments").select("amount"),
    supabase.from("student_finance").select("total_due"),
    supabase.from("attendance").select("present"),
    supabase.from("grades").select("score, max_score, coefficient, status"),
    supabase.from("inscription_requests").select("status"),
    supabase
      .from("profiles")
      .select("universe")
      .in("role", ["etudiant", "professionnel", "dirigeant"]),
  ]);

  // Effectifs par univers de formation.
  const byUniverse = new Map<string, number>();
  for (const p of learners ?? []) {
    const name = p.universe
      ? universeNameById[p.universe] ?? "Autre"
      : "Non précisé";
    byUniverse.set(name, (byUniverse.get(name) ?? 0) + 1);
  }
  const universeRows = [...byUniverse.entries()].sort((a, b) => b[1] - a[1]);

  // Effectifs par filière + par niveau.
  const classInfo = new Map(
    (classes ?? []).map((c) => [c.id, { level: c.level, filiere_id: c.filiere_id }])
  );
  const filiereName = new Map((filieres ?? []).map((f) => [f.id, f.name]));
  const byFiliere = new Map<string, number>();
  const byLevel = new Map<string, number>();
  for (const m of members ?? []) {
    const info = classInfo.get(m.class_id);
    if (!info) continue;
    const fname = info.filiere_id
      ? filiereName.get(info.filiere_id) ?? "Sans filière"
      : "Sans filière";
    byFiliere.set(fname, (byFiliere.get(fname) ?? 0) + 1);
    const lvl = info.level || "Niveau non défini";
    byLevel.set(lvl, (byLevel.get(lvl) ?? 0) + 1);
  }
  const filiereRows = [...byFiliere.entries()].sort((a, b) => b[1] - a[1]);
  const levelRows = [...byLevel.entries()].sort((a, b) => b[1] - a[1]);

  // Finance.
  const encaisse = (payments ?? []).reduce((a, p) => a + Number(p.amount), 0);
  const du = (finances ?? []).reduce((a, f) => a + Number(f.total_due), 0);
  const recouvrement = du > 0 ? Math.round((encaisse / du) * 100) : null;

  // Assiduité.
  const att = attendance ?? [];
  const present = att.filter((a) => a.present).length;
  const tauxPresence = att.length > 0 ? Math.round((present / att.length) * 100) : null;

  // Résultats (notes validées).
  const validGrades = (grades ?? []).filter((g) => g.status === "valide");
  const moyenne = averageValue(validGrades);

  // Candidatures par statut.
  const candByStatus = new Map<string, number>();
  for (const c of candidatures ?? []) {
    const s = c.status ?? "nouveau";
    candByStatus.set(s, (candByStatus.get(s) ?? 0) + 1);
  }

  const metric = (label: string, value: string, accent?: string) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${accent ?? "text-ipmd-black"}`}>
        {value}
      </p>
    </div>
  );

  const bars = (rows: [string, number][], color: string) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
      <ul className="space-y-2">
        {rows.map(([label, n]) => (
          <li key={label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/70">{label}</span>
              <span className="font-bold text-ipmd-black">{n}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ipmd-light">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.round((n / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  };

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
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Statistiques
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Pilotage global de l&apos;établissement.
          </p>

          {/* Indicateurs clés */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metric("Étudiants", String(headCount(studentsC)))}
            {metric("Enseignants", String(headCount(teachersC)))}
            {metric("Classes", String(headCount(classesC)))}
            {metric("Cours", String(headCount(coursC)))}
          </div>

          {/* Effectifs */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 font-bold text-ipmd-black">
                Effectifs par filière
              </h2>
              {filiereRows.length === 0 ? (
                <p className="text-sm text-black/45">Aucun étudiant affecté.</p>
              ) : (
                bars(filiereRows, "bg-ipmd-red")
              )}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 font-bold text-ipmd-black">Par niveau</h2>
              {levelRows.length === 0 ? (
                <p className="text-sm text-black/45">Aucun étudiant affecté.</p>
              ) : (
                bars(levelRows, "bg-ipmd-black")
              )}
            </div>
          </div>

          {/* Effectifs par univers */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 font-bold text-ipmd-black">
              Effectifs par univers
            </h2>
            {universeRows.length === 0 ? (
              <p className="text-sm text-black/45">
                Aucun univers renseigné sur les profils.
              </p>
            ) : (
              bars(universeRows, "bg-ipmd-red")
            )}
          </div>

          {/* Finance / Assiduité / Résultats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Recouvrement
              </p>
              <p className="mt-1 text-3xl font-extrabold text-green-600">
                {recouvrement !== null ? `${recouvrement}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-black/50">
                {formatFCFA(encaisse)} / {formatFCFA(du)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Taux de présence
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ipmd-black">
                {tauxPresence !== null ? `${tauxPresence}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-black/50">
                {att.length} pointage(s)
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Moyenne école
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ipmd-red">
                {moyenne !== null ? `${moyenne}/20` : "—"}
              </p>
              <p className="mt-1 text-xs text-black/50">
                {moyenne !== null ? mention(moyenne) : "Notes validées"}
              </p>
            </div>
          </div>

          {/* Candidatures */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 font-bold text-ipmd-black">
              Candidatures par statut
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CANDIDATURE_STATUSES.map((s) => (
                <div
                  key={s.value}
                  className="rounded-xl bg-ipmd-light px-4 py-3 text-center"
                >
                  <p className="text-2xl font-extrabold text-ipmd-black">
                    {candByStatus.get(s.value) ?? 0}
                  </p>
                  <p className="text-xs font-semibold text-black/55">
                    {CANDIDATURE_LABEL[s.value]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
