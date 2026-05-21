import { createClient } from "@convex-dev/better-auth";
import { convex as convexPlugin } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { GenericCtx } from "@convex-dev/better-auth";

export const authComponent = createClient<DataModel>(components.betterAuth);

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const authSecret =
  process.env.BETTER_AUTH_SECRET ?? "local-development-secret-change-me";

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: siteUrl,
    secret: authSecret,
    database: authComponent.adapter(ctx),
    trustedOrigins: [siteUrl],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convexPlugin({ authConfig })],
  });
}
