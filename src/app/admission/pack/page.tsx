import type { Metadata } from "next";
import Image from "next/image";
import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PackView } from "@/components/admission/PackView";

export const metadata: Metadata = {
  title: "Mon pack d'admission — IPMD",
  robots: { index: false, follow: false },
};

function Invalid({ msg }: { msg?: string }) {
  return (
    <section className="min-h-screen bg-ipmd-light px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
            <Image src="/logo-ipmd.png" alt="IPMD" width={44} height={44} className="h-full w-full object-contain" />
          </span>
          <p className="font-extrabold tracking-tight text-ipmd-black">IPMD — Pack d&apos;admission</p>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3 bg-ipmd-red px-6 py-4 text-white">
            <span className="text-2xl">⛔</span>
            <p className="font-bold">Lien invalide ou expiré</p>
          </div>
          <p className="px-6 py-5 text-sm text-black/60">
            {msg ??
              "Ce lien n'est plus valide (expiré ou renouvelé). Merci de demander un nouveau lien à l'IPMD (admission@ipmd.pro)."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function PackPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const link = t ? await verifyPackToken(t) : null;
  if (!link) return <Invalid />;

  const admin = createAdminClient();
  if (!admin) return <Invalid msg="Service momentanément indisponible. Réessayez plus tard." />;

  const { data: pack } = await admin
    .from("admission_packs")
    .select(
      "id, candidature_id, accepted_level, registration_fee, tuition_due, academic_year, first_viewed_at, reglement_accepted_at"
    )
    .eq("id", link.packId)
    .single();
  if (!pack) return <Invalid />;

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, program_interest")
    .eq("id", pack.candidature_id)
    .single();

  // Trace de consultation.
  const now = new Date().toISOString();
  await admin
    .from("admission_packs")
    .update({
      last_viewed_at: now,
      ...(pack.first_viewed_at ? {} : { first_viewed_at: now }),
    })
    .eq("id", pack.id);

  return (
    <PackView
      name={cand?.full_name ?? ""}
      program={cand?.program_interest ?? null}
      level={pack.accepted_level ?? null}
      academicYear={pack.academic_year ?? null}
      registrationFee={Number(pack.registration_fee ?? 0)}
      tuitionDue={pack.tuition_due != null ? Number(pack.tuition_due) : null}
      token={t as string}
      reglementAcceptedAt={pack.reglement_accepted_at ?? null}
    />
  );
}
