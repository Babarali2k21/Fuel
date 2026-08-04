"use client";

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell, AuthUnavailable } from "@/components/AuthPageShell";

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return <AuthUnavailable mode="sign-in" />;
  }

  return (
    <AuthPageShell mode="sign-in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
