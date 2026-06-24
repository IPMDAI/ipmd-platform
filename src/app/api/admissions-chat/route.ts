import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMISSIONS_CHAT_MODEL, buildAdmissionsSystem, type ChatFees } from "@/lib/admissions-chat";

export const runtime = "nodejs";

/** Grille tarifaire réelle (lecture via service-role, endpoint public). */
async function loadFees(): Promise<ChatFees | undefined> {
  try {
    const admin = createAdminClient();
    if (!admin) return undefined;
    const [{ data: settings }, { data: levels }] = await Promise.all([
      admin.from("finance_settings").select("registration_fee").eq("id", 1).maybeSingle(),
      admin.from("tuition_levels").select("level, amount").order("sort_order"),
    ]);
    return {
      registration: Number(settings?.registration_fee ?? 300000),
      levels: (levels ?? []).map((l) => ({ level: l.level as string, amount: Number(l.amount ?? 0) })),
    };
  } catch {
    return undefined;
  }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitize(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()) {
      out.push({ role: m.role, content: m.content.slice(0, 2000) });
    }
  }
  const trimmed = out.slice(-16);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== "user") return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  // Endpoint PUBLIC (visiteurs). Pas d'authentification.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "L'assistant n'est pas disponible pour le moment. Écrivez-nous sur WhatsApp : +225 07 75 75 88 88." },
      { status: 503 }
    );
  }

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
  const identified = (body as { identified?: unknown })?.identified === true;

  const fees = await loadFees();
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = client.messages.stream({
          model: ADMISSIONS_CHAT_MODEL,
          max_tokens: 1024,
          // Système mis en cache (réutilisé d'un message à l'autre → entrée moins chère).
          system: [
            {
              type: "text",
              text: buildAdmissionsSystem(fees, identified),
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });
        for await (const event of claude) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Admissions chat error:", err);
        controller.enqueue(
          encoder.encode("\n\nDésolé, une erreur est survenue. Écrivez-nous sur WhatsApp : +225 07 75 75 88 88.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
