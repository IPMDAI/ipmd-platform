import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { ADMISSIONS_CHAT_MODEL, buildAdmissionsSystem } from "@/lib/admissions-chat";

export const runtime = "nodejs";

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

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = client.messages.stream({
          model: ADMISSIONS_CHAT_MODEL,
          max_tokens: 1024,
          system: buildAdmissionsSystem(),
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
