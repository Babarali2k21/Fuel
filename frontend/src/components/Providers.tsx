"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerkAppearance";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";

import { I18nProvider } from "@/i18n/provider";
import { authBypassed } from "@/lib/features";

interface AuthContextValue {
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
}

const defaultAuth: AuthContextValue = {
  getToken: async () => null,
  isSignedIn: authBypassed,
};

const AuthContext = createContext<AuthContextValue>(defaultAuth);

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider
      value={{
        getToken: auth.getToken,
        isSignedIn: authBypassed || Boolean(auth.isSignedIn),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSafeAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthContext.Provider value={defaultAuth}>{children}</AuthContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} appearance={clerkAppearance}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ClerkAuthBridge>{children}</ClerkAuthBridge>
        </I18nProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
