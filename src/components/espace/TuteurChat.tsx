"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "C'est quoi le marketing digital ?",
  "Donne-moi un exercice pratique en UX/UI",
  "Comment débuter en intelligence artificielle ?",
];

export function TuteurChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // Lecture progressive du flux.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { role: "assistant", content: last.content + chunk };
          return copy;
        });
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Le tuteur est momentanément indisponible. Réessaie dans un instant.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: message };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="text-lg font-bold text-ipmd-black">Tuteur IA</h2>
          <p className="text-xs text-black/50">
            Ton assistant personnel pour le digital & l&apos;IA
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-black/60">
              Bonjour {firstName} 👋 Pose-moi une question sur tes cours, ou
              choisis un sujet :
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-black/10 bg-ipmd-light px-3 py-1.5 text-xs font-medium text-ipmd-black transition-colors hover:border-ipmd-red hover:text-ipmd-red"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-ipmd-red text-white"
                    : "bg-ipmd-light text-ipmd-black"
                }`}
              >
                {m.content || (
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/40 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/40 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/40" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-black/5 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris ta question…"
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-ipmd-red"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ipmd-red text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Envoyer"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
