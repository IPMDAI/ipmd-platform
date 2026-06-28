"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AssistantAvatar } from "./AssistantAvatar";
import { PhoneField } from "@/components/forms/PhoneField";
import { captureChatLead } from "@/lib/prospect-actions";

type Msg = { role: "user" | "assistant"; content: string };

const LEAD_KEY = "ipmd_chat_lead";

const GREETING =
  "Bonjour 👋 Je suis Awa, votre assistante d'admission à l'IPMD. Posez-moi vos questions sur nos formations, les frais, les cours du soir, l'admission ou une réorientation !";

// Questions gratuites avant identification, puis plafond anti-abus.
const FREE_QUESTIONS = 3;
const MAX_QUESTIONS = 15;

// Voix féminines françaises courantes (Windows, macOS, Android, Google…).
const FEMALE_VOICE_HINTS = [
  "amelie", "amélie", "audrey", "virginie", "julie", "marie", "léa", "lea", "hortense",
  "charlotte", "celine", "céline", "sandrine", "aurelie", "aurélie", "female", "femme",
  "google français", "eloise", "élise", "elise",
];

// Nettoie le texte pour la lecture vocale : retire emojis, markdown et symboles
// (sinon la voix dit « visage souriant », « flèche vers la droite »…).
function cleanForSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")           // emojis (😊 👋 🎓 …)
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")               // drapeaux
    .replace(/[‍️⃣]/g, "")                 // jointeurs / sélecteurs de variante
    .replace(/[←-⇿⬀-⯿☀-⛿]/g, "") // flèches & symboles divers
    .replace(/[*_#`~>•|]/g, "")                           // markdown / puces
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickFrenchFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const fr = voices.filter((v) => v.lang.toLowerCase().startsWith("fr"));
  if (fr.length === 0) return null;
  const female = fr.find((v) => FEMALE_VOICE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
  return female || fr[0];
}

// Questions cliquables proposées au visiteur (pour « faire parler » l'assistante sans taper).
const SUGGESTIONS = [
  "Quelles formations proposez-vous ?",
  "Y a-t-il des cours du soir ?",
  "Comment se passe l'admission ?",
  "Puis-je me réorienter vers le digital ?",
];

export function AdmissionsChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState<string | null>(null); // nom du prospect identifié
  const [gateDismissed, setGateDismissed] = useState(false); // a choisi de continuer sans s'identifier
  const [mode, setMode] = useState<"tel" | "email">("tel");
  const [capBusy, setCapBusy] = useState(false);
  const [capErr, setCapErr] = useState<string | null>(null);
  const [listening, setListening] = useState(false); // micro en écoute
  const [voiceOut, setVoiceOut] = useState(false);   // Awa lit ses réponses
  const [voiceIn, setVoiceIn] = useState(false);     // micro disponible (navigateur)
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recogRef = useRef<{ stop: () => void } | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voiceOutRef = useRef(false); // miroir de voiceOut (évite les closures périmées)
  const [handsFree, setHandsFree] = useState(false); // mode conversation vocale continue
  const handsFreeRef = useRef(false);
  const openRef = useRef(false);
  const micAvailableRef = useRef(false); // micro utilisable (pas dans le formulaire d'identification)

  useEffect(() => { voiceOutRef.current = voiceOut; }, [voiceOut]);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

  // Le champ de saisie s'agrandit avec le texte (jusqu'à ~5 lignes).
  // La barre de défilement n'apparaît qu'au-delà de la hauteur max (sinon flèches ▲▼ parasites).
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    el.style.overflowY = el.scrollHeight > 120 ? "auto" : "hidden";
  }, [input, open]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LEAD_KEY);
      if (v) setLead(v);
    } catch {}
    // Reconnaissance vocale dispo ? (Chrome, Edge, Android…)
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    if (w.SpeechRecognition || w.webkitSpeechRecognition) setVoiceIn(true);
    // Choisit une voix féminine française pour Awa (les voix se chargent de façon asynchrone).
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const load = () => { voiceRef.current = pickFrenchFemaleVoice(window.speechSynthesis.getVoices()); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  // 🎙️ Démarre l'écoute du micro (réutilisé pour le mode mains-libres).
  const startListening = () => {
    const w = window as unknown as { SpeechRecognition?: new () => never; webkitSpeechRecognition?: new () => never };
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => {
          lang: string; interimResults: boolean; continuous: boolean;
          start: () => void; stop: () => void;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onend: (() => void) | null; onerror: (() => void) | null;
        })
      | undefined;
    if (!SR) return;
    // Parler = mode vocal : on active la voix d'Awa pour un vrai échange oral.
    setVoiceOut(true);
    voiceOutRef.current = true;
    const r = new SR();
    r.lang = "fr-FR";
    r.interimResults = true;
    r.continuous = false;
    let transcript = "";
    r.onresult = (e) => {
      transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(transcript);
    };
    r.onend = () => {
      setListening(false);
      const t = transcript.trim();
      if (t) { setInput(""); void send(t); } // envoi automatique de ce qui a été dit
    };
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch {}
  };

  // Bouton micro : démarre / arrête le mode vocal mains-libres.
  const toggleMic = () => {
    if (listening) { setHandsFree(false); recogRef.current?.stop(); return; }
    setHandsFree(true);
    handsFreeRef.current = true;
    startListening();
  };

  // 🔊 Lecture vocale de la réponse d'Awa (si activée).
  const speakOut = (text: string) => {
    if (!voiceOutRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const spoken = cleanForSpeech(text);
      if (!spoken) return;
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = "fr-FR";
      u.rate = 1.02;
      u.pitch = 1.08; // voix un peu plus douce / féminine
      if (voiceRef.current) u.voice = voiceRef.current;
      u.onend = () => {
        // Mode mains-libres : on rouvre le micro pour enchaîner la conversation.
        if (handsFreeRef.current && openRef.current && micAvailableRef.current) {
          setTimeout(() => { if (handsFreeRef.current) startListening(); }, 250);
        }
      };
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const toggleVoiceOut = () => {
    setVoiceOut((v) => {
      const next = !v;
      if (!next) {
        // On coupe la voix → on quitte aussi le mode mains-libres.
        setHandsFree(false);
        handsFreeRef.current = false;
        recogRef.current?.stop();
        if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, lead]);

  // Fermeture du chat → on stoppe micro, voix et mode mains-libres.
  useEffect(() => {
    openRef.current = open;
    if (!open) {
      setHandsFree(false);
      handsFreeRef.current = false;
      recogRef.current?.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    }
  }, [open]);

  // Micro indisponible quand le formulaire d'identification remplace la saisie.
  useEffect(() => {
    const asked = messages.filter((m) => m.role === "user").length;
    micAvailableRef.current = voiceIn && !(!lead && asked >= FREE_QUESTIONS && !gateDismissed);
  }, [messages, voiceIn, lead, gateDismissed]);

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
    setMessages((m) => [...m, { role: "assistant", content: `Merci ${prenom} ! 🙌 Je continue à répondre à vos questions.` }]);
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
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
        body: JSON.stringify({ messages: next.filter((m) => m.content), identified: !!lead }),
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
      if (acc) speakOut(acc); // lecture vocale si activée
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

  const askedCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="fab-chat fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3 transition-transform duration-300 print:hidden">
      {open && (
        <div className="flex h-[60vh] max-h-[520px] w-[88vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between bg-ipmd-black px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="relative">
                <AssistantAvatar className="h-10 w-10 rounded-full ring-2 ring-white/20" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-ipmd-black" />
              </span>
              <div>
                <p className="text-sm font-bold">Awa · Assistante Admission ✨</p>
                <p className="text-[11px] text-white/70">En ligne · Réponses instantanées</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleVoiceOut}
                aria-label={voiceOut ? "Couper la voix d'Awa" : "Activer la voix d'Awa"}
                title={voiceOut ? "Voix activée — Awa lit ses réponses" : "Activer la voix d'Awa"}
                className={`rounded-lg p-1.5 text-base hover:bg-white/10 ${voiceOut ? "text-ipmd-red" : "text-white/70"}`}
              >
                {voiceOut ? "🔊" : "🔇"}
              </button>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 text-white/70 hover:bg-white/10">✕</button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ipmd-light/40 p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "bg-ipmd-red text-white" : "bg-white text-ipmd-black ring-1 ring-black/5"}`}>
                  {m.content || (busy ? "…" : "")}
                </div>
              </div>
            ))}

            {/* Questions suggérées — cliquables, pour démarrer sans taper. */}
            {askedCount === 0 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-ipmd-red/30 bg-white px-3 py-1.5 text-left text-[12px] font-medium text-ipmd-red shadow-sm transition-colors hover:bg-ipmd-red hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!lead && askedCount >= FREE_QUESTIONS && !gateDismissed ? (
            <form onSubmit={onCapture} className="max-h-[58%] space-y-2.5 overflow-y-auto border-t border-black/5 bg-white px-3 py-3">
              <p className="text-xs font-bold text-ipmd-black">Pour le détail précis (frais exacts, inscription, rentrée, suivi) 👇</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="prenom" required placeholder="Prénom *" className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
                <input name="nom" required placeholder="Nom *" className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode("tel")} className={`rounded-xl px-2 py-1.5 text-xs font-semibold ${mode === "tel" ? "bg-ipmd-black text-white" : "bg-ipmd-light text-black/60"}`}>📱 Téléphone</button>
                <button type="button" onClick={() => setMode("email")} className={`rounded-xl px-2 py-1.5 text-xs font-semibold ${mode === "email" ? "bg-ipmd-black text-white" : "bg-ipmd-light text-black/60"}`}>📧 Email</button>
              </div>
              {mode === "tel" ? (
                <PhoneField id="chat-phone" name="phone" />
              ) : (
                <input name="email" type="email" placeholder="vous@email.com" className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none" />
              )}
              {capErr && <p className="text-xs font-medium text-ipmd-red">{capErr}</p>}
              <button type="submit" disabled={capBusy} className="w-full rounded-xl bg-ipmd-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {capBusy ? "…" : "Valider et continuer 💬"}
              </button>
              <button type="button" onClick={() => setGateDismissed(true)} className="w-full text-center text-[11px] font-semibold text-black/45 hover:text-ipmd-red">
                Continuer sans m'identifier →
              </button>
            </form>
          ) : (
          <div className="border-t border-black/5 bg-white px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
              {!lead && askedCount >= FREE_QUESTIONS && (
                <button type="button" onClick={() => setGateDismissed(false)} className="rounded-full bg-ipmd-red/10 px-2.5 py-1 font-semibold text-ipmd-red">
                  📝 M'identifier (infos précises)
                </button>
              )}
              <a href="https://wa.me/2250775758888" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366]/10 px-2.5 py-1 font-semibold text-[#128C7E]">WhatsApp</a>
              <Link href="/demande-info" className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-ipmd-black hover:bg-black/5">✉️ Demande d&apos;info</Link>
            </div>
            {handsFree && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-ipmd-red/10 px-2.5 py-1.5 text-[11px] font-semibold text-ipmd-red">
                <span className="h-2 w-2 animate-pulse rounded-full bg-ipmd-red" />
                🎧 Conversation vocale — {listening ? "parlez, je vous écoute…" : "Awa va vous réécouter après sa réponse"}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={listening ? "🎙️ Parlez…" : "Votre question…"}
                className="max-h-[120px] min-h-[40px] flex-1 resize-none overflow-hidden rounded-xl border border-black/10 px-3 py-2 text-sm leading-relaxed text-ipmd-black focus:border-ipmd-red focus:outline-none"
              />
              {voiceIn && (
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={busy && !handsFree}
                  aria-label={handsFree ? "Arrêter le mode vocal" : "Parler à Awa"}
                  title={handsFree ? "Mode vocal mains-libres actif — cliquez pour arrêter" : "Parler au lieu d'écrire (mode mains-libres)"}
                  className={`shrink-0 rounded-xl px-3 py-2 text-base ring-1 transition-colors disabled:opacity-40 ${listening ? "animate-pulse bg-ipmd-red text-white ring-ipmd-red" : handsFree ? "bg-ipmd-red text-white ring-ipmd-red" : "bg-white text-ipmd-red ring-ipmd-red/30 hover:bg-ipmd-red/10"}`}
                >
                  🎙️
                </button>
              )}
              <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-ipmd-red px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                ➤
              </button>
            </form>
            <p className="mt-1 text-center text-[9px] text-black/35">Assistant IA — les frais/dates exacts sont à confirmer auprès des admissions.</p>
          </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Discuter avec l'assistante d'admission"
        className="flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-ipmd-black p-0 text-sm font-semibold text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95 sm:w-auto sm:pr-5"
      >
        {open ? <span className="text-base">✕</span> : <><AssistantAvatar className="h-14 w-14 rounded-full" /><span className="hidden sm:inline">Poser une question</span></>}
      </button>
    </div>
  );
}
