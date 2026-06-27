import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { AddProspectForm } from "@/components/espace/AddProspectForm";
import { ProspectRow, type Prospect } from "@/components/espace/ProspectRow";
import { PROSPECT_STATUS, PROSPECT_STATUS_LIST } from "@/lib/prospect";
import { universes } from "@/data/universes";

export const metadata: Metadata = { title: "Marketing / Prospects" };

const STAFF = ["super_admin", "admin", "scolarite"];
const universeNames: Record<string, string> = Object.fromEntries(universes.map((u) => [u.id, u.name]));
const kindById: Record<string, string> = Object.fromEntries(universes.map((u) => [u.id, u.kind]));
const typeOf = (uId: string | null | undefined) => {
  const k = uId ? kindById[uId] : undefined;
  return k === "diplome" ? "diplome" : k === "certificat" ? "bootcamp" : "autre";
};

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; universe?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const { data } = await supabase
    .from("prospects")
    .select("id, full_name, email, phone, whatsapp, universe, program_interest, level_interest, format, source, message, status, note, created_at")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Prospect[];

  const countBy: Record<string, number> = {};
  for (const p of all) countBy[p.status] = (countBy[p.status] ?? 0) + 1;
  const total = all.length;
  const inscrits = countBy["inscrit"] ?? 0;
  const conv = total > 0 ? Math.round((inscrits / total) * 100) : 0;

  // Filtres type (diplôme/bootcamp) + univers, combinables avec le statut.
  const activeType = sp.type === "diplome" || sp.type === "bootcamp" ? sp.type : "";
  const activeUniv = sp.universe && universeNames[sp.universe] ? sp.universe : "";
  const diplomeCount = all.filter((p) => typeOf(p.universe) === "diplome").length;
  const bootcampCount = all.filter((p) => typeOf(p.universe) === "bootcamp").length;
  const countByUniv: Record<string, number> = {};
  for (const p of all) if (p.universe) countByUniv[p.universe] = (countByUniv[p.universe] ?? 0) + 1;
  const filterUniverses = universes.filter(
    (u) => (u.kind === "diplome" || u.kind === "certificat") && (!activeType || typeOf(u.id) === activeType)
  );

  const active = sp.status && PROSPECT_STATUS[sp.status] ? sp.status : "tous";
  const shown = all.filter(
    (p) =>
      (active === "tous" || p.status === active) &&
      (!activeType || typeOf(p.universe) === activeType) &&
      (!activeUniv || p.universe === activeUniv)
  );

  const buildHref = (o: { status?: string; type?: string; universe?: string }) => {
    const m = { status: active === "tous" ? "" : active, type: activeType, universe: activeUniv, ...o };
    const qs = new URLSearchParams();
    if (m.status) qs.set("status", m.status);
    if (m.type) qs.set("type", m.type);
    if (m.universe) qs.set("universe", m.universe);
    const s = qs.toString();
    return s ? `/espace/marketing?${s}` : "/espace/marketing";
  };
  const q = (s: string) => buildHref({ status: s === "tous" ? "" : s });

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">Marketing / Prospects</h1>
          <p className="mt-1 text-sm text-black/55">
            Suivi des demandes d&apos;information et pipeline d&apos;admission.
          </p>

          {/* Tableau de bord */}
          <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Total prospects</p>
              <p className="mt-0.5 text-base font-extrabold text-ipmd-black">{total}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Inscrits</p>
              <p className="mt-0.5 text-base font-extrabold text-green-600">{inscrits}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Taux de conversion</p>
              <p className="mt-0.5 text-base font-extrabold text-ipmd-red">{conv}%</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Candidatures</p>
              <p className="mt-0.5 text-base font-extrabold text-ipmd-black">{countBy["candidature"] ?? 0}</p>
            </div>
          </div>

          <div className="mt-6">
            <AddProspectForm />
          </div>

          {/* Filtre type : Diplômes vs Bootcamps */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={buildHref({ type: "", universe: "" })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!activeType ? "bg-ipmd-black text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>Tout</Link>
            <Link href={buildHref({ type: "diplome", universe: "" })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${activeType === "diplome" ? "bg-ipmd-black text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>🎓 Diplômes {diplomeCount}</Link>
            <Link href={buildHref({ type: "bootcamp", universe: "" })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${activeType === "bootcamp" ? "bg-ipmd-black text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>📜 Bootcamps {bootcampCount}</Link>
          </div>
          {/* Filtre univers */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={buildHref({ universe: "" })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!activeUniv ? "bg-ipmd-black text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>Tous les univers</Link>
            {filterUniverses.map((u) => (
              <Link key={u.id} href={buildHref({ universe: u.id })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${activeUniv === u.id ? "bg-ipmd-black text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>
                {u.name} {countByUniv[u.id] ?? 0}
              </Link>
            ))}
          </div>

          {/* Filtres pipeline */}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
            <Link href={q("tous")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${active === "tous" ? "bg-ipmd-red text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>
              Tous ({total})
            </Link>
            {PROSPECT_STATUS_LIST.map((s) => (
              <Link key={s.key} href={q(s.key)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${active === s.key ? "bg-ipmd-red text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"}`}>
                {s.label} ({countBy[s.key] ?? 0})
              </Link>
            ))}
          </div>

          {/* Liste */}
          {shown.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun prospect dans cette vue. Ajoute-en un, ou partage le lien public{" "}
              <Link href="/demande-info" className="font-semibold text-ipmd-red hover:underline">/demande-info</Link>.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {shown.map((p) => (
                <ProspectRow key={p.id} p={p} />
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
