"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneField } from "@/components/forms/PhoneField";
import { captureChatLead } from "@/lib/prospect-actions";

type Msg = { role: "user" | "assistant"; content: string };

const LEAD_KEY = "ipmd_chat_lead";

const GREETING =
  "Bonjour 👋 Je suis l'assistant d'admission de l'IPMD. Posez-moi vos questions sur nos formations, les frais, les cours du soir, l'admission ou une réorientation !";

// Plafond anti-abus : nombre max de questions par visiteur (par session).
const MAX_QUESTIONS = 15;

export function AdmissionsChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState<string | null>(null); // nom du prospect identifié
  const [mode, setMode] = useState<"tel" | "email">("tel");
  const [capBusy, setCapBusy] = useState(false);
  const [capErr, setCapErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LEAD_KEY);
      if (v) setLead(v);
    } catch {}
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, lead]);

  if (pathname?.startsWith("/espace")) return null;

  const onCapture = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCapErr(null);
    const fd = new FormData(e.currentTarget);
    const prenom = (fd.get("prenom") as string)?.trim() || "";
    const nom = (fd.get("nom") as string)?.trim() || "";
    const phone = (fd.get("phone") as string)?.trim() || "";
    const email = (fd.get("email") as string)?.trim() || "";
    if (!prenom || !nom) { setCapErr("Renseignez votre prénom et votre nom."); return; }
    if (mode === "tel" && !phone) { setCapErr("Renseignez votre numéro."); return; }
    if (mode === "email" && !email) { setCapErr("Renseignez votre email."); return; }
    const fullName = `${nom.toUpperCase()} ${prenom}`;
    setCapBusy(true);
    const res = await captureChatLead({ fullName, phone: mode === "tel" ? phone : "", email: mode === "email" ? email : "" });
    setCapBusy(false);
    if (!res.ok) { setCapErr(res.message || "Une erreur est survenue."); return; }
    try { localStorage.setItem(LEAD_KEY, prenom); } catch {}
    setLead(prenom);
    setMessages([{ role: "assistant", content: `Bonjour ${prenom} 👋 Ravi de vous accueillir ! Posez-moi vos questions sur nos formations, les frais, les cours du soir, l'admission ou une réorientation.` }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    // Limite par visiteur : au-delà, on invite à laisser ses coordonnées.
    const asked = messages.filter((m) => m.role === "user").length;
    if (asked >= MAX_QUESTIONS) {
      setMessages((m) => [
        ...m,
        { role: "user", content: text },
        {
          role: "assistant",
          content:
            "Merci pour toutes ces questions ! 😊 Pour un suivi personnalisé, laissez vos coordonnées sur ipmd.pro/demande-info ou écrivez-nous sur WhatsApp +225 07 75 75 88 88 — un conseiller vous répondra.",
        },
      ]);
      setInput("");
      return;
    }
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

          {!lead ? (
            <form onSubmit={onCapture} className="flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm font-semibold text-ipmd-black">Avant de discuter, dites-nous qui vous êtes 👇</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-black/60">Prénom *</label>
                  <input name="prenom" required placeholder="Votre prénom" className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60">Nom *</label>
                  <input name="nom" required placeholder="Votre nom" className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60">Moyen de contact *</label>
                <div className="mt-1 mb-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMode("tel")} className={`rounded-xl px-3 py-2 text-sm font-semibold ${mode === "tel" ? "bg-ipmd-black text-white" : "bg-ipmd-light text-black/60"}`}>📱 Téléphone</button>
                  <button type="button" onClick={() => setMode("email")} className={`rounded-xl px-3 py-2 text-sm font-semibold ${mode === "email" ? "bg-ipmd-black text-white" : "bg-ipmd-light text-black/60"}`}>📧 Email</button>
                </div>
                {mode === "tel" ? (
                  <PhoneField id="chat-phone" name="phone" />
                ) : (
                  <input name="email" type="email" placeholder="vous@email.com" className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
                )}
                <p className="mt-1 text-[11px] text-black/45">Choisissez votre pays puis saisissez votre numéro — l'indicatif est ajouté automatiquement.</p>
              </div>
              {capErr && <p className="text-xs font-medium text-ipmd-red">{capErr}</p>}
              <button type="submit" disabled={capBusy} className="w-full rounded-xl bg-ipmd-red px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {capBusy ? "…" : "Commencer la discussion 💬"}
              </button>
              <p className="text-center text-[10px] text-black/35">Vos coordonnées permettent un suivi par l'équipe des admissions.</p>
            </form>
          ) : (
          <>
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
          </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Discuter avec l'assistant d'admission"
        className="flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-ipmd-black text-sm font-semibold text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95 sm:w-auto sm:px-5"
      >
        {open ? "✕" : <><span className="text-lg">💬</span><span className="hidden sm:inline">Poser une question</span></>}
      </button>
    </div>
  );
}
