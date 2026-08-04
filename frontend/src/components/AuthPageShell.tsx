"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { GlassCard, PageMain } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";

interface AuthPageShellProps {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
}

export function AuthPageShell({ mode, children }: AuthPageShellProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  const redirectQuery = redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : "";

  const title = mode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle");
  const subtitle = mode === "sign-in" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle");

  return (
    <PageMain className="pb-16">
      <section className="hero-glow mb-6">
        <GlassCard strong className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 ring-1 ring-teal-400/20">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">
                SpritCheck
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)]">
              {title}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              {subtitle}
            </p>
          </div>
        </GlassCard>
      </section>

      <ul className="mb-6 space-y-2">
        {[t("auth.feature1"), t("auth.feature2"), t("auth.feature3")].map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)] before:h-1 before:w-1 before:rounded-full before:bg-teal-400/70 before:content-['']"
          >
            {feature}
          </li>
        ))}
      </ul>

      <GlassCard strong className="p-5 sm:p-6">
        {children}
      </GlassCard>

      <p className="mt-6 text-center text-xs leading-relaxed text-[var(--text-muted)]">
        {mode === "sign-in" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
        <Link
          href={`${mode === "sign-in" ? "/sign-up" : "/sign-in"}${redirectQuery}`}
          className="font-medium text-teal-300 hover:text-teal-200"
        >
          {mode === "sign-in" ? t("auth.createAccount") : t("auth.signInLink")}
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          ← {t("auth.backHome")}
        </Link>
      </p>
    </PageMain>
  );
}

interface AuthUnavailableProps {
  mode: "sign-in" | "sign-up";
}

export function AuthUnavailable({ mode }: AuthUnavailableProps) {
  const { t } = useTranslation();

  return (
    <AuthPageShell mode={mode}>
      <div className="py-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{t("auth.unavailable")}</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 py-2.5 text-sm font-semibold text-[#042f2e]"
        >
          {t("auth.backHome")}
        </Link>
      </div>
    </AuthPageShell>
  );
}
