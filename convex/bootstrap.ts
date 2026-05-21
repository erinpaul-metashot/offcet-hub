"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAuth } from "./auth";

export const bootstrapAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    bootstrapToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN ?? "";

    if (!bootstrapToken || args.bootstrapToken !== bootstrapToken) {
      throw new Error("A valid bootstrap token is required for admin bootstrap.");
    }

    const existingAdmin = await ctx.runQuery(internal.users.hasAdminAccount, {});
    if (existingAdmin) {
      throw new Error("An admin account already exists.");
    }

    const auth = createAuth(ctx);
    const result = await auth.api.signUpEmail({
      body: {
        email: args.email,
        password: args.password,
        name: args.name,
      },
    });

    await ctx.runMutation(internal.users.insertAdminRecord, {
      authUserId: result.user.id,
      email: result.user.email,
      name: args.name,
      phone: args.phone,
    });

    return {
      email: result.user.email,
      message: "Admin account created.",
    };
  },
});