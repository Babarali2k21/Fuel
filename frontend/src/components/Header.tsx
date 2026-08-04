"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSafeAuth } from "@/components/Providers";
import { useTranslation } from "@/i18n/provider";
import { featuresUnlocked } from "@/lib/features";

function ClerkAuthButtons({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <div className={`rounded-full ring-1 ring-[var(--border)] ${className}`}>
        <UserButton />
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${className}`}
    >
      {t("common.signIn")}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isSignedIn } = useSafeAuth();
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: "/logbook", label: t("nav.logbook") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/settings", label: t("nav.profile") },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const showPremiumCta = !featuresUnlocked;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(5,8,12,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="group flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/10 ring-1 ring-teal-400/20">
              <Sparkles className="h-4 w-4 text-teal-300" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                SpritCheck
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t("common.austria")}
              </span>
            </div>
          </Link>

          <LanguageSwitcher compact />

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            {showPremiumCta && (
              <Link
                href="/upgrade"
                className="rounded-full bg-gradient-to-r from-amber-300/90 to-amber-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#422006]"
              >
                {clerkEnabled ? t("common.startFreeTrial") : t("common.premium")}
              </Link>
            )}
            {clerkEnabled && <ClerkAuthButtons />}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] ring-1 ring-[var(--border)] transition hover:bg-white/5 md:hidden"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label={t("nav.closeMenu")}
          />
          <nav className="absolute right-0 top-0 flex h-full w-[min(100%,18rem)] flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{t("nav.menu")}</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-teal-400/10 text-teal-200 ring-1 ring-teal-400/20"
                        : "text-[var(--text-secondary)] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto space-y-3 border-t border-[var(--border)] pt-5">
              {showPremiumCta && (
                <Link
                  href="/upgrade"
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-amber-400 py-3 text-sm font-semibold text-[#422006]"
                >
                  {clerkEnabled ? t("common.startFreeTrial") : t("common.premium")}
                </Link>
              )}
              {clerkEnabled && !isSignedIn && (
                <Link
                  href="/sign-in"
                  className="flex w-full items-center justify-center rounded-full border border-[var(--border-strong)] py-3 text-sm font-medium text-[var(--text-secondary)]"
                >
                  {t("common.signIn")}
                </Link>
              )}
              {clerkEnabled && isSignedIn && (
                <div className="flex justify-center">
                  <ClerkAuthButtons />
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
