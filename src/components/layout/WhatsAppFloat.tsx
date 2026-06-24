"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const CONTACTS = [
  { label: "Admissions & Inscriptions", display: "+225 07 75 75 88 88", number: "2250775758888" },
  { label: "Scolarité & Informations", display: "+225 05 66 05 14 14", number: "2250566051414" },
];

const PREFILL = encodeURIComponent("Bonjour IPMD, je souhaite avoir des informations.");

/** Bouton WhatsApp Business flottant — pour les visiteurs du site (masqué dans l'espace). */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // On n'affiche pas dans l'espace privé (ERP).
  if (pathname?.startsWith("/espace")) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="bg-[#075E54] px-4 py-3 text-white">
            <p className="text-sm font-bold">Discutons sur WhatsApp 💬</p>
            <p className="text-[11px] text-white/80">Réponse rapide pendant les heures ouvrables.</p>
          </div>
          <div className="divide-y divide-black/5">
            {CONTACTS.map((c) => (
              <a
                key={c.number}
                href={`https://wa.me/${c.number}?text=${PREFILL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ipmd-light"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <WaIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ipmd-black">{c.label}</span>
                  <span className="block text-xs text-black/55">{c.display}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Contacter l'IPMD sur WhatsApp"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <WaIcon className="h-7 w-7" />
        )}
      </button>
    </div>
  );
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.74 5.5 2.13 7.9L.5 31.5l7.8-2.05A15.4 15.4 0 0 0 16 31.5c8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5Zm0 28.2c-2.5 0-4.9-.67-7-1.93l-.5-.3-4.63 1.22 1.24-4.5-.33-.52A12.7 12.7 0 1 1 16 28.7Zm7-9.5c-.38-.19-2.26-1.12-2.61-1.25-.35-.13-.6-.19-.86.19-.25.38-.98 1.25-1.2 1.5-.22.25-.44.28-.82.1-.38-.19-1.6-.59-3.05-1.88-1.13-1-1.89-2.25-2.11-2.63-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.86-2.07-1.18-2.84-.31-.74-.63-.64-.86-.65-.22-.01-.47-.01-.72-.01s-.66.1-1 .47c-.34.38-1.31 1.28-1.31 3.13s1.34 3.63 1.53 3.88c.19.25 2.64 4.03 6.4 5.65.89.38 1.59.61 2.13.78.9.28 1.71.24 2.36.15.72-.11 2.26-.92 2.58-1.81.32-.89.32-1.66.22-1.81-.09-.16-.34-.25-.72-.44Z" />
    </svg>
  );
}
