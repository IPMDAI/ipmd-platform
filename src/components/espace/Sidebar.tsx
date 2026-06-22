"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav";
import { signOut } from "@/lib/auth-actions";

function isActive(pathname: string, href: string): boolean {
  if (href === "/espace") return pathname === "/espace";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  groups,
  badges = {},
  roleLabel,
  userName,
}: {
  groups: NavGroup[];
  badges?: Record<string, { count: number; alert: boolean }>;
  roleLabel: string;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex h-full flex-col">
      {/* Identité */}
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ipmd-red-light">
          {roleLabel}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-white">
          {userName}
        </p>
      </div>

      {/* Groupes */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group, gi) => (
          <div key={group.title ?? gi} className={gi > 0 ? "mt-5" : ""}>
            {group.title && (
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const badge = badges[item.href];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-ipmd-red font-semibold text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {badge && badge.count > 0 && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                            active
                              ? "bg-white/25 text-white"
                              : badge.alert
                              ? "bg-ipmd-red text-white"
                              : "bg-white/15 text-white/90"
                          }`}
                        >
                          {badge.count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Déconnexion */}
      <div className="border-t border-white/10 p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="text-base leading-none">⏻</span>
            Se déconnecter
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-1.5 text-ipmd-black hover:bg-black/5"
        >
          <span className="text-xl">☰</span>
        </button>
        <span className="text-sm font-bold text-ipmd-black">Espace IPMD</span>
      </div>

      {/* Sidebar fixe (desktop) */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 bg-ipmd-black lg:block">
        {nav}
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ipmd-black shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-3 z-10 rounded-lg p-1 text-white/70 hover:bg-white/10"
            >
              <span className="text-lg">✕</span>
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
