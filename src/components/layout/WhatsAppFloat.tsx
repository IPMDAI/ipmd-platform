"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DemandeInfoForm } from "@/components/forms/DemandeInfoForm";

const CONTACTS = [
  { label: "Admissions & Inscriptions", display: "+225 07 75 75 88 88", number: "2250775758888" },
  { label: "Scolarité & Informations", display: "+225 05 66 05 14 14", number: "2250566051414" },
];

const PREFILL = encodeURIComponent("Bonjour IPMD, je souhaite avoir des informations.");

/** Bouton WhatsApp Business flottant — pour les visiteurs du site (masqué dans l'espace). */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // On n'affiche pas dans l'espace privé (ERP).
  if (pathname?.startsWith("/espace")) return null;

  return (
    <>
    {/* Modale « Demande d'information » (popup, sans changer de page) */}
    {infoOpen && (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 print:hidden sm:items-center sm:p-4" onClick={() => setInfoOpen(false)}>
        <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-ipmd-light p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setInfoOpen(false)} aria-label="Fermer" className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-black/60 ring-1 ring-black/10 hover:text-ipmd-red">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ipmd-red">Admissions</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ipmd-black">Demande d&apos;information</h2>
          <p className="mt-1 mb-4 text-sm text-black/55">
            Laissez-nous vos coordonnées, l&apos;équipe des admissions vous recontacte rapidement.
          </p>
          <DemandeInfoForm />
        </div>
      </div>
    )}

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

      {/* Bouton « Demande d'info » — ouvre une popup (sans changer de page) */}
      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        aria-label="Demande d'information"
        title="Demande d'information"
        className="flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-ipmd-red text-sm font-semibold text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95 sm:w-auto sm:px-4"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16v12H4z" strokeLinejoin="round" />
          <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Demande d&apos;info</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Contacter l'IPMD sur WhatsApp"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center self-end rounded-full bg-[#25D366] text-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95"
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
    </>
  );
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.74 5.5 2.13 7.9L.5 31.5l7.8-2.05A15.4 15.4 0 0 0 16 31.5c8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5Zm0 28.2c-2.5 0-4.9-.67-7-1.93l-.5-.3-4.63 1.22 1.24-4.5-.33-.52A12.7 12.7 0 1 1 16 28.7Zm7-9.5c-.38-.19-2.26-1.12-2.61-1.25-.35-.13-.6-.19-.86.19-.25.38-.98 1.25-1.2 1.5-.22.25-.44.28-.82.1-.38-.19-1.6-.59-3.05-1.88-1.13-1-1.89-2.25-2.11-2.63-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.86-2.07-1.18-2.84-.31-.74-.63-.64-.86-.65-.22-.01-.47-.01-.72-.01s-.66.1-1 .47c-.34.38-1.31 1.28-1.31 3.13s1.34 3.63 1.53 3.88c.19.25 2.64 4.03 6.4 5.65.89.38 1.59.61 2.13.78.9.28 1.71.24 2.36.15.72-.11 2.26-.92 2.58-1.81.32-.89.32-1.66.22-1.81-.09-.16-.34-.25-.72-.44Z" />
    </svg>
  );
}
