"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Bonjour 👋 Je suis l'assistant d'admission de l'IPMD. Posez-moi vos questions sur nos formations, les frais, les cours du soir, l'admission ou une réorientation !";

export function AdmissionsChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (pathname?.startsWith("/espace")) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/admissions-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.content) }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: j?.error || "Service indisponible. Écrivez-nous sur WhatsApp." };
          return c;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: acc };
          return c;
        });
      }
    } catch {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: "Désolé, une erreur est survenue. Écrivez-nous sur WhatsApp : +225 07 75 75 88 88." };
        return c;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-3 print:hidden">
      {open && (
        <div className="flex h-[60vh] max-h-[520px] w-[88vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between bg-ipmd-black px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Assistant Admission ✨</p>
              <p className="text-[11px] text-white/70">Réponses instantanées · IPMD</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 text-white/70 hover:bg-white/10">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ipmd-light/40 p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "bg-ipmd-red text-white" : "bg-white text-ipmd-black ring-1 ring-black/5"}`}>
                  {m.content || (busy ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 bg-white px-3 py-2">
            <div className="mb-2 flex gap-2 text-[11px]">
              <Link href="/demande-info" className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-ipmd-black hover:bg-black/5">📝 Laisser mes coordonnées</Link>
              <a href="https://wa.me/2250775758888" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366]/10 px-2.5 py-1 font-semibold text-[#128C7E]">WhatsApp</a>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Votre question…"
                className="max-h-24 flex-1 resize-none rounded-xl border border-black/10 px-3 py-2 text-sm text-ipmd-black focus:border-ipmd-red focus:outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-ipmd-red px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                ➤
              </button>
            </form>
            <p className="mt-1 text-center text-[9px] text-black/35">Assistant IA — les frais/dates exacts sont à confirmer auprès des admissions.</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Discuter avec l'assistant d'admission"
        className="flex h-14 items-center gap-2 rounded-full bg-ipmd-black px-5 text-sm font-semibold text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? "✕" : <><span className="text-lg">💬</span> Poser une question</>}
      </button>
    </div>
  );
}
