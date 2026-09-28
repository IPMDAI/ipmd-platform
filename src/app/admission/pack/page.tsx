import type { Metadata } from "next";
import Image from "next/image";
import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PackView } from "@/components/admission/PackView";
import type { ScheduleSnapshot } from "@/lib/admission-schedule";
import { admissionDeadlineText, isAdmissionExpired } from "@/lib/admission-deadline";

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
      "id, candidature_id, class_id, accepted_level, registration_fee, tuition_due, academic_year, schedule_json, first_viewed_at, reglement_accepted_at, convention_status, signature_method"
    )
    .eq("id", link.packId)
    .single();
  if (!pack) return <Invalid />;

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, program_interest, admission_sent_at")
    .eq("id", pack.candidature_id)
    .single();

  // Formation + niveau RÉELLEMENT ACCEPTÉS : résolus depuis la classe du pack
  // (class_id → classes.level + filieres.name), et non depuis le programme
  // DEMANDÉ par le candidat (`program_interest`, qui peut mentionner un autre
  // niveau). Évite toute discordance (ex. postulé L3 / admis L2). Repli sur
  // program_interest / accepted_level si le pack n'a pas de classe (packs anciens).
  let acceptedProgram = (cand?.program_interest as string) ?? null;
  let acceptedLevel = (pack.accepted_level as string) ?? null;
  if (pack.class_id) {
    const { data: klass } = await admin
      .from("classes")
      .select("level, filiere_id")
      .eq("id", pack.class_id)
      .single();
    if (klass?.level) acceptedLevel = klass.level as string;
    if (klass?.filiere_id) {
      const { data: fil } = await admin
        .from("filieres")
        .select("name")
        .eq("id", klass.filiere_id)
        .single();
      if (fil?.name) acceptedProgram = fil.name as string;
    }
  }

  // Deadline 72 h (calculée depuis l'ancre admission_sent_at ; jamais stockée).
  const admissionSentAt = (cand?.admission_sent_at as string) ?? null;
  const deadlineText = admissionDeadlineText(admissionSentAt);
  const deadlineExpired = isAdmissionExpired(admissionSentAt);

  // Plans de paiement disponibles. Certifiant (snapshot marqué `max_installments`) :
  // comptant −15 % + échelonné N× (plein) ; sinon Campus (payment_plans data-driven).
  const schedForPlans = (pack.schedule_json as ScheduleSnapshot | null) ?? null;
  let plans: { plan_months: number; discount_rate: number }[];
  if (schedForPlans && typeof schedForPlans.max_installments === "number") {
    // Certifiant (Option A) : échéancier fixe N× au tarif plein, PAS de sélecteur de
    // plan (la remise −15 % se réalise au paiement en 1 fois). Aucun plan alternatif.
    plans = [];
  } else {
    const { data: plansData } = await admin
      .from("payment_plans")
      .select("plan_months, discount_rate")
      .eq("academic_year", pack.academic_year ?? "")
      .eq("active", true)
      .order("plan_months", { ascending: true });
    plans = (plansData ?? []).map((p) => ({
      plan_months: Number(p.plan_months),
      discount_rate: Number(p.discount_rate),
    }));
  }

  // Dernière preuve de paiement (W2) pour l'inscription (état affiché au candidat).
  const { data: lastProof } = await admin
    .from("payment_proofs")
    .select("status, review_note")
    .eq("candidature_id", pack.candidature_id)
    .eq("kind", "inscription")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
      program={acceptedProgram}
      level={acceptedLevel}
      academicYear={pack.academic_year ?? null}
      registrationFee={Number(pack.registration_fee ?? 0)}
      tuitionDue={pack.tuition_due != null ? Number(pack.tuition_due) : null}
      token={t as string}
      packId={pack.id as string}
      reglementAcceptedAt={pack.reglement_accepted_at ?? null}
      conventionStatus={(pack.convention_status as string) ?? "non_envoyee"}
      signatureMethod={(pack.signature_method as string) ?? null}
      schedule={(pack.schedule_json as ScheduleSnapshot | null) ?? null}
      plans={plans}
      deadlineText={deadlineText}
      deadlineExpired={deadlineExpired}
      proofStatus={(lastProof?.status as "a_verifier" | "valide" | "rejete" | null) ?? null}
      proofReviewNote={(lastProof?.review_note as string) ?? null}
    />
  );
}
