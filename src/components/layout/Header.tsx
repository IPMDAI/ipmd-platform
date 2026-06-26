"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/data/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/auth-actions";

export function Header({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Ombre/fond renforcés au défilement.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all ${
        scrolled
          ? "border-black/10 bg-white/90 backdrop-blur-md"
          : "border-transparent bg-white/70 backdrop-blur-sm"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-ipmd-red"
                      : "text-ipmd-black/80 hover:text-ipmd-red"
                  }`}
                >
                  {item.label}
                  <span aria-hidden className="text-xs">
                    ▾
                  </span>
                </Link>
                <div className="invisible absolute left-0 top-full w-72 translate-y-2 rounded-2xl border border-black/5 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child, ci) =>
                    child.heading ? (
                      <p
                        key={`${child.label}-${ci}`}
                        className={`px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-ipmd-red ${ci > 0 ? "mt-2 border-t border-black/5 pt-2" : "pt-1"}`}
                      >
                        {child.label}
                      </p>
                    ) : (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-3 py-2 transition-colors hover:bg-ipmd-light"
                      >
                        <span className="block text-sm font-semibold text-ipmd-black/90">{child.label}</span>
                        {child.description && (
                          <span className="block text-xs text-black/50">{child.description}</span>
                        )}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-ipmd-red"
                    : "text-ipmd-black/80 hover:text-ipmd-red"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isAuthenticated ? (
            <>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-ipmd-black/80 transition-colors hover:text-ipmd-red"
                >
                  Déconnexion
                </button>
              </form>
              <Button href="/espace" size="md">
                Mon espace
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="text-sm font-semibold text-ipmd-black/80 transition-colors hover:text-ipmd-red"
              >
                Connexion
              </Link>
              <Button href="/admission" size="md">
                Demander une admission
              </Button>
            </>
          )}
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ipmd-black lg:hidden"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </Container>

      {/* Menu mobile déroulant */}
      {open && (
        <div className="border-t border-black/10 bg-white lg:hidden">
          <Container className="space-y-1 py-4">
            {mainNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-base font-semibold text-ipmd-black"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-3 border-l border-black/10 pl-3">
                    {item.children.map((child, ci) =>
                      child.heading ? (
                        <p key={`${child.label}-${ci}`} className="px-3 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-ipmd-red">
                          {child.label}
                        </p>
                      ) : (
                        <Link key={child.href} href={child.href} className="block rounded-lg px-3 py-2">
                          <span className="block text-sm font-semibold text-ipmd-black/80">{child.label}</span>
                          {child.description && (
                            <span className="block text-xs text-black/50">{child.description}</span>
                          )}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="space-y-2 pt-3">
              {isAuthenticated ? (
                <>
                  <Button href="/espace" className="w-full">
                    Mon espace
                  </Button>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-base font-semibold text-ipmd-black"
                    >
                      Déconnexion
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="block rounded-lg px-3 py-2.5 text-base font-semibold text-ipmd-black"
                  >
                    Connexion
                  </Link>
                  <Button href="/admission" className="w-full">
                    Demander une admission
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
