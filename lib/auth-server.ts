import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { isAuthError } from "@/lib/utils";

export const {
  handler,
  getToken,
  isAuthenticated,
  preloadAuthQuery,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "",
  jwtCache: {
    enabled: true,
    isAuthError,
  },
});
