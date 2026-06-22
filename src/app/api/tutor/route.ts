import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TUTOR_MODEL, buildTutorSystem } from "@/lib/tutor";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Valide et nettoie l'historique reçu du client. */
function sanitize(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
    ) {
      out.push({ role: m.role, content: m.content.slice(0, 4000) });
    }
  }
  // Garde les 20 derniers messages, doit finir par un message utilisateur.
  const trimmed = out.slice(-20);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== "user") {
    return null;
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  // 1. Authentification : seul un utilisateur connecté peut utiliser le tuteur.
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Service indisponible." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Veuillez vous connecter." }, { status: 401 });
  }

  // 2. Clé API Claude.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Le Tuteur IA n'est pas encore activé. Réessaie bientôt !" },
      { status: 503 }
    );
  }

  // 3. Historique de conversation.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const messages = sanitize((body as { messages?: unknown })?.messages);
  if (!messages) {
    return Response.json({ error: "Message manquant." }, { status: 400 });
  }

  // 4. Profil pour personnaliser le tuteur (côté serveur, non falsifiable).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name || (user.user_metadata?.full_name as string) || "l'étudiant";
  const role = profile?.role ?? "etudiant";
  const system = buildTutorSystem(fullName, role);

  // 5. Appel Claude en streaming → réponse texte progressive.
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = client.messages.stream({
          model: TUTOR_MODEL,
          max_tokens: 2048,
          system,
          messages,
        });

        for await (const event of claude) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Tuteur IA error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\nDésolé, une erreur est survenue. Réessaie dans un instant."
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
