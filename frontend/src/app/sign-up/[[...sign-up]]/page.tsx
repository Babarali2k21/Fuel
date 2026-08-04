"use client";

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell, AuthUnavailable } from "@/components/AuthPageShell";

function SignUpContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return <AuthUnavailable mode="sign-up" />;
  }

  return (
    <AuthPageShell mode="sign-up">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </AuthPageShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}
