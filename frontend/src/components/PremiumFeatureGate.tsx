"use client";

import { PremiumLock } from "@/components/PremiumLock";
import { GlassCard } from "@/components/ui";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useTranslation } from "@/i18n/provider";

interface PremiumFeatureGateProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PremiumFeatureGate({ title, description, children }: PremiumFeatureGateProps) {
  const { t } = useTranslation();
  const { hasPremium, isLoading } = usePremiumAccess();

  if (hasPremium) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
        {t("dashboard.loading")}
      </GlassCard>
    );
  }

  return <PremiumLock title={title} description={description} />;
}
