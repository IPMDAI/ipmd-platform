import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Container";
import { MessageTemplatesManager } from "@/components/espace/MessageTemplatesManager";
import type { MessageTemplateRow } from "@/lib/dossier-actions";

export const metadata: Metadata = { title: "Modèles de messages" };
export const dynamic = "force-dynamic";

export default async function ModelesMessagesPage() {
  await requireAdmin();

  const admin = createAdminClient();
  let templates: MessageTemplateRow[] = [];
  if (admin) {
    const { data } = await admin
      .from("message_templates")
      .select("id, title, body")
      .order("created_at", { ascending: false });
    templates = (data ?? []).map((t) => ({
      id: t.id as string,
      title: t.title as string,
      body: t.body as string,
    }));
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace/candidatures"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Candidatures
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Modèles de messages
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Créez vos propres modèles. Ils s&apos;ajoutent aux modèles intégrés et apparaissent en 1
            clic dans la réponse à un candidat.
          </p>
          <div className="mt-6">
            <MessageTemplatesManager initial={templates} />
          </div>
        </div>
      </Container>
    </section>
  );
}
