"use client";

import Link from "next/link";

import { GlassCard } from "./ui";
import { useTranslation } from "@/i18n/provider";

interface AuthPromptProps {
  title: string;
  description: string;
}

export function AuthPrompt({ title, description }: AuthPromptProps) {
  const { t } = useTranslation();

  return (
    <GlassCard className="p-5">
      <p className="font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/sign-in"
          className="inline-flex justify-center rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-4 py-2.5 text-sm font-semibold text-[#042f2e]"
        >
          {t("common.signIn")}
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {t("auth.createAccount")}
        </Link>
      </div>
    </GlassCard>
  );
}
