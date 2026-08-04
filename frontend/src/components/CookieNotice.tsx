"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PrimaryButton } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";

export function CookieNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("spritcheck-cookies-accepted");
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 px-5">
      <div className="glass-panel-strong mx-auto max-w-lg rounded-[1.25rem] p-5">
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t("cookies.message")}{" "}
          <Link href="/privacy" className="font-medium text-teal-300 hover:text-teal-200">
            {t("common.privacyPolicy")}
          </Link>
          .
        </p>
        <PrimaryButton
          onClick={() => {
            localStorage.setItem("spritcheck-cookies-accepted", "true");
            setVisible(false);
          }}
          className="px-5 py-2.5"
        >
          {t("common.accept")}
        </PrimaryButton>
      </div>
    </div>
  );
}
