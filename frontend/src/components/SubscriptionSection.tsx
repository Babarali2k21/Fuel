"use client";

import { Crown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PrimaryButton } from "@/components/ui";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale === "de" ? "de-AT" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionSection() {
  const { t, locale } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();
  const { hasPremium, me } = usePremiumAccess();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      return api.getPortal(token);
    },
    onSuccess: (data) => {
      window.location.href = data.portal_url;
    },
  });

  if (!isSignedIn) {
    return null;
  }

  const isTrialing = me?.subscription_status === "trialing";
  const trialEnd = me?.trial_end ? formatDate(me.trial_end, locale) : null;
  const renewDate = formatDate(me?.current_period_end ?? null, locale);

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-300" />
        <h2 className="font-medium text-[var(--text-primary)]">{t("settings.subscription")}</h2>
      </div>

      {hasPremium ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-amber-400/10 px-4 py-3 ring-1 ring-amber-400/20">
            <p className="text-sm font-semibold text-amber-200">
              {isTrialing ? t("settings.trialActive") : t("settings.premiumActive")}
            </p>
            {isTrialing && trialEnd && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t("settings.trialEndsCharge", { date: trialEnd })}
              </p>
            )}
            {!isTrialing && me && renewDate !== "—" && !me.cancel_at_period_end && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t("settings.renewsOn", { date: renewDate })}
              </p>
            )}
            {me?.cancel_at_period_end && renewDate !== "—" && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t("settings.cancelsOn", { date: renewDate })}
              </p>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">{t("settings.cancelAnytime")}</p>
          <PrimaryButton
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="w-full py-2.5"
          >
            <ExternalLink className="h-4 w-4" />
            {t("settings.manageOrCancel")}
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">{t("settings.premiumSettingsDescription")}</p>
          <Link
            href="/upgrade"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 py-2.5 text-sm font-semibold text-[#042f2e]"
          >
            {t("common.startFreeTrial")}
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
