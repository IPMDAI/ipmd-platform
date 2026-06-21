"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Sous-titre optionnel (ex. nom de l'année). */
  subtitle?: string;
  children: ReactNode;
}

/**
 * Pop-up accessible : ferme à l'Échap, au clic sur le fond, bloque le scroll.
 * Tout le contenu est défilable (le haut reste accessible, y compris sur mobile).
 */
export function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Fond (fixe, couvre tout l'écran) */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Conteneur défilable */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative z-10 my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-ipmd-black">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-sm font-semibold text-ipmd-red">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ipmd-light text-lg text-ipmd-black transition-colors hover:bg-ipmd-red hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
