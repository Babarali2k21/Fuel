export const authBypassed = process.env.NEXT_PUBLIC_BYPASS_AUTH !== "false";

export const featuresUnlocked =
  process.env.NEXT_PUBLIC_BYPASS_PREMIUM !== "false" || authBypassed;
