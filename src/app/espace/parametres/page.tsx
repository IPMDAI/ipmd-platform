import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { ProfileSettings } from "@/components/espace/ProfileSettings";
import { roleLabels } from "@/lib/dashboards";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function ParametresPage() {
  const { supabase, userId } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, birth_date, birth_place")
    .eq("id", userId)
    .single();

  const role = profile?.role ?? "etudiant";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Paramètres
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Gère ton profil et ton mot de passe.
          </p>

          <div className="mt-8">
            <ProfileSettings
              fullName={profile?.full_name ?? ""}
              email={profile?.email ?? ""}
              roleLabel={roleLabels[role] ?? role}
              birthDate={profile?.birth_date ?? null}
              birthPlace={profile?.birth_place ?? null}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
