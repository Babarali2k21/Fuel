"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Check, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PageMain, PrimaryButton, SectionLabel, SecondaryButton } from "@/components/ui";
import { getUpgradeFeatures } from "@/i18n";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";

type Plan = "monthly" | "yearly";

function isPlan(value: string | null): value is Plan {
  return value === "monthly" || value === "yearly";
}

function UpgradeContent() {
  const { t, locale } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutStarted = useRef(false);

  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const features = getUpgradeFeatures(locale);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const meQuery = useQuery({
    queryKey: ["me"],
    enabled: isSignedIn,
    queryFn: async () => api.getMe((await getToken())!),
  });

  const trialDays = meQuery.data?.trial_days ?? 7;
  const showTrialOffer = !meQuery.data?.is_premium && !meQuery.data?.has_used_trial;

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (isPlan(plan) && !isSignedIn) {
      setPendingPlan(plan);
    }
  }, [searchParams, isSignedIn]);

  const startCheckout = useCallback(
    async (plan: Plan) => {
      if (meQuery.data?.is_premium) {
        setError(t("upgrade.alreadySubscribed"));
        return;
      }

      setLoadingPlan(plan);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          setPendingPlan(plan);
          return;
        }

        const { checkout_url } = await api.createCheckout(plan, token);
        window.location.href = checkout_url;
      } catch (err) {
        setError(err instanceof Error ? err.message : t("upgrade.checkoutFailed"));
        setLoadingPlan(null);
      }
    },
    [getToken, meQuery.data?.is_premium, t],
  );

  useEffect(() => {
    if (!isSignedIn || !pendingPlan || meQuery.isLoading || checkoutStarted.current) {
      return;
    }

    checkoutStarted.current = true;
    void startCheckout(pendingPlan).finally(() => {
      checkoutStarted.current = false;
      setPendingPlan(null);
    });
  }, [isSignedIn, pendingPlan, meQuery.isLoading, startCheckout]);

  const selectPlan = (plan: Plan) => {
    setError(null);

    if (meQuery.data?.is_premium) {
      setError(t("upgrade.alreadySubscribed"));
      return;
    }

    if (!isSignedIn) {
      setPendingPlan(plan);
      return;
    }

    void startCheckout(plan);
  };

  const planLabel = (plan: Plan) => (plan === "monthly" ? t("upgrade.monthly") : t("upgrade.yearly"));
  const continueUrl = pendingPlan ? `/upgrade?plan=${pendingPlan}` : "/upgrade";

  const successMessage =
    meQuery.data?.subscription_status === "trialing" || showTrialOffer
      ? t("upgrade.trialSuccess")
      : t("upgrade.success");

  const planCardClass = (plan: Plan) => {
    const selected = pendingPlan === plan;
    const base =
      plan === "yearly"
        ? "relative overflow-hidden rounded-[1.25rem] border p-5 text-left transition disabled:opacity-60"
        : "glass-panel rounded-[1.25rem] p-5 text-left transition hover:bg-[var(--surface-hover)] disabled:opacity-60";

    const selectedRing = selected
      ? "ring-2 ring-teal-400/60 border-teal-400/40"
      : plan === "yearly"
        ? "border-amber-400/25 bg-gradient-to-br from-amber-400/15 to-amber-600/5 hover:brightness-110"
        : "";

    return `${base} ${selectedRing}`;
  };

  return (
    <PageMain className="pb-12">
      <section className="hero-glow mb-8">
        <GlassCard strong className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 ring-1 ring-amber-400/20">
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                SpritCheck {t("common.premium")}
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-[var(--text-primary)]">
              {t("upgrade.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {t("upgrade.subtitle")}
            </p>
            {showTrialOffer && (
              <p className="mt-3 text-sm font-medium text-teal-300">{t("upgrade.trialDescription")}</p>
            )}
          </div>
        </GlassCard>
      </section>

      {showTrialOffer && (
        <GlassCard className="mb-6 border border-teal-400/20 bg-teal-400/5 p-5">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-200">
            <Sparkles className="h-3 w-3" />
            {t("upgrade.trialBadge")}
          </div>
          <p className="text-sm leading-relaxed text-teal-100/90">{t("upgrade.trialDescription")}</p>
        </GlassCard>
      )}

      {pendingPlan && !isSignedIn && (
        <GlassCard strong className="mb-6 border border-teal-400/25 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">
            {t("upgrade.selectedPlan")}: {planLabel(pendingPlan)}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
            {t("upgrade.continueTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("upgrade.continueDescription", { days: trialDays })}
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            {clerkEnabled ? (
              <>
                <SignUpButton mode="modal" forceRedirectUrl={continueUrl}>
                  <PrimaryButton className="w-full">{t("upgrade.signUpAndContinue")}</PrimaryButton>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl={continueUrl}>
                  <SecondaryButton className="w-full">{t("upgrade.signInAndContinue")}</SecondaryButton>
                </SignInButton>
              </>
            ) : (
              <>
                <Link href={`/sign-up?redirect_url=${encodeURIComponent(continueUrl)}`}>
                  <PrimaryButton className="w-full">{t("upgrade.signUpAndContinue")}</PrimaryButton>
                </Link>
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(continueUrl)}`}>
                  <SecondaryButton className="w-full">{t("upgrade.signInAndContinue")}</SecondaryButton>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setPendingPlan(null);
                if (searchParams.get("plan")) {
                  router.replace("/upgrade");
                }
              }}
              className="py-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
            >
              {t("common.cancel")}
            </button>
          </div>
        </GlassCard>
      )}

      {isSignedIn && pendingPlan && loadingPlan === null && (
        <div className="mb-4 rounded-2xl border border-teal-400/20 bg-teal-400/5 px-4 py-3 text-sm text-teal-100">
          {t("upgrade.continuingCheckout")}
        </div>
      )}

      {isSignedIn && meQuery.data?.has_used_trial && !meQuery.data?.is_premium && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">{t("upgrade.noTrialNote")}</p>
      )}

      {success && (
        <div className="mb-4 rounded-2xl border border-teal-400/20 bg-teal-400/5 px-4 py-3 text-sm text-teal-100">
          {successMessage}
        </div>
      )}
      {canceled && (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
          {t("upgrade.canceled")}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <SectionLabel>{t("upgrade.featuresTitle")}</SectionLabel>
      <div className="mb-8 space-y-2">
        {features.map((feature) => (
          <GlassCard key={feature} className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/15">
              <Check className="h-3 w-3 text-teal-300" strokeWidth={3} />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
          </GlassCard>
        ))}
      </div>

      <SectionLabel>{t("upgrade.plansTitle")}</SectionLabel>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => selectPlan("monthly")}
          disabled={loadingPlan !== null || meQuery.data?.is_premium}
          className={planCardClass("monthly")}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {t("upgrade.monthly")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--text-primary)]">
            {showTrialOffer ? (
              <>
                <span className="text-teal-300">
                  {trialDays} {locale === "de" ? "Tage gratis" : "days free"}
                </span>
                <span className="mt-1 block text-base font-normal text-[var(--text-muted)]">
                  {t("upgrade.thenPrice")} €4,99{t("upgrade.perMonth")}
                </span>
              </>
            ) : (
              <>
                €4,99
                <span className="text-base font-normal text-[var(--text-muted)]">
                  {t("upgrade.perMonth")}
                </span>
              </>
            )}
          </p>
          {showTrialOffer && (
            <p className="mt-2 text-xs text-teal-300/80">{t("upgrade.trialCta")}</p>
          )}
        </button>

        <button
          type="button"
          onClick={() => selectPlan("yearly")}
          disabled={loadingPlan !== null || meQuery.data?.is_premium}
          className={planCardClass("yearly")}
        >
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            <Sparkles className="h-3 w-3" />
            {t("upgrade.recommended")}
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-200/70">
            {t("upgrade.yearly")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--text-primary)]">
            {showTrialOffer ? (
              <>
                <span className="text-teal-300">
                  {trialDays} {locale === "de" ? "Tage gratis" : "days free"}
                </span>
                <span className="mt-1 block text-base font-normal text-[var(--text-muted)]">
                  {t("upgrade.thenPrice")} €39{t("upgrade.perYear")}
                </span>
              </>
            ) : (
              <>
                €39
                <span className="text-base font-normal text-[var(--text-muted)]">
                  {t("upgrade.perYear")}
                </span>
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-amber-200/80">{t("upgrade.yearlySavings")}</p>
        </button>
      </div>
    </PageMain>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
