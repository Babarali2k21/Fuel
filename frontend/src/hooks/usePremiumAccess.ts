"use client";

import { useQuery } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { api } from "@/lib/api";
import { featuresUnlocked } from "@/lib/features";

export function usePremiumAccess() {
  const { getToken, isSignedIn } = useSafeAuth();

  const meQuery = useQuery({
    queryKey: ["me"],
    enabled: isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      return token ? api.getMe(token) : api.getMe(null);
    },
    retry: false,
  });

  const hasPremium = featuresUnlocked || meQuery.data?.is_premium === true;

  return {
    hasPremium,
    isLoading: !featuresUnlocked && isSignedIn && meQuery.isLoading,
    me: meQuery.data,
    refetchMe: meQuery.refetch,
  };
}
