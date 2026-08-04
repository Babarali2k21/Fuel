"use client";

import { GlassCard, PageMain } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <PageMain className="pb-12">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
        {t("privacy.title")}
      </h1>

      <GlassCard className="space-y-4 p-6 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
        <p>{t("privacy.p3")}</p>
        <p className="text-[var(--text-muted)]">{t("privacy.contact")}</p>
      </GlassCard>
    </PageMain>
  );
}
