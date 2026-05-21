import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAuth } from "./auth";
import { dashboardPathForRole, getViewer } from "./helpers";
import { publicRegistrationSchema, profileUpdateSchema } from "../lib/validators";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);

    if (!viewer?.authUser) {
      return null;
    }

    return {
      authUserId: viewer.authUser.id,
      authName: viewer.authUser.name,
      authEmail: viewer.authUser.email,
      profileComplete: Boolean(viewer.user),
      dashboardPath: viewer.user ? dashboardPathForRole(viewer.user.role) : "/register",
      user: viewer.user
        ? {
            ...viewer.user,
            profile: viewer.profile,
          }
        : null,
    };
  },
});

export const completeProfile = mutation({
  args: {
    role: v.union(v.literal("supplier"), v.literal("buyer"), v.literal("agent")),
    name: v.string(),
    phone: v.string(),
    companyName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    address: v.string(),
    warehouseAddress: v.optional(v.string()),
    goodsTypes: v.optional(v.array(v.string())),
    businessName: v.optional(v.string()),
    categoriesInterested: v.optional(v.array(v.string())),
    fullName: v.optional(v.string()),
    serviceDescription: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const parsed = profileUpdateSchema.parse(args);
    const viewer = await getViewer(ctx);

    if (!viewer?.authUser) {
      throw new Error("Authentication required.");
    }

    const basePatch = {
      name: parsed.name,
      phone: parsed.phone,
    };

    if (!viewer.user) {
      const userId = await ctx.db.insert("users", {
        authUserId: viewer.authUser.id,
        email: viewer.authUser.email,
        name: parsed.name,
        phone: parsed.phone,
        role: parsed.role,
        status: "pending",
        createdAt: Date.now(),
      });

      await upsertRoleProfile(ctx, userId, parsed);
      return userId;
    }

    if (viewer.user.role !== parsed.role) {
      throw new Error("Role changes are not allowed after registration.");
    }

    await ctx.db.patch(viewer.user._id, basePatch);
    await upsertRoleProfile(ctx, viewer.user._id, parsed);
    return viewer.user._id;
  },
});

export const finalizeRegistration = internalMutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    role: v.union(v.literal("supplier"), v.literal("buyer"), v.literal("agent")),
    name: v.string(),
    phone: v.string(),
    companyName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    address: v.string(),
    warehouseAddress: v.optional(v.string()),
    goodsTypes: v.optional(v.array(v.string())),
    businessName: v.optional(v.string()),
    categoriesInterested: v.optional(v.array(v.string())),
    fullName: v.optional(v.string()),
    serviceDescription: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_user_id", (query) => query.eq("authUserId", args.authUserId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      authUserId: args.authUserId,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      status: "pending",
      createdAt: Date.now(),
    });

    await upsertRoleProfile(ctx, userId, args);
    return userId;
  },
});

export const registerUser = action({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("supplier"), v.literal("buyer"), v.literal("agent")),
    name: v.string(),
    phone: v.string(),
    companyName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    address: v.string(),
    warehouseAddress: v.optional(v.string()),
    goodsTypes: v.optional(v.array(v.string())),
    businessName: v.optional(v.string()),
    categoriesInterested: v.optional(v.array(v.string())),
    fullName: v.optional(v.string()),
    serviceDescription: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const parsed = publicRegistrationSchema.parse(args);
    const { password, ...profileData } = parsed;
    const auth = createAuth(ctx);
    const result = await auth.api.signUpEmail({
      body: {
        email: profileData.email,
        password,
        name: profileData.name,
      },
    });

    await ctx.runMutation(internal.users.finalizeRegistration, {
      ...profileData,
      authUserId: result.user.id,
      email: result.user.email,
    });

    return {
      email: result.user.email,
      message: "Registration submitted. An admin will review the account.",
    };
  },
});

export const hasAdminAccount = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (query) => query.eq("role", "admin"))
      .unique();

    return Boolean(existingAdmin);
  },
});

export const insertAdminRecord = internalMutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      authUserId: args.authUserId,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: "admin",
      status: "approved",
      createdAt: Date.now(),
    });
  },
});

async function upsertRoleProfile(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: Record<string, unknown>,
) {
  const role = args.role as "supplier" | "buyer" | "agent";

  if (role === "supplier") {
    const existing = await ctx.db
      .query("supplierProfiles")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();

    const patch = {
      userId,
      companyName: args.companyName as string,
      taxId: args.taxId as string,
      address: args.address as string,
      warehouseAddress: args.warehouseAddress as string | undefined,
      goodsTypes: (args.goodsTypes as string[]) ?? [],
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("supplierProfiles", patch);
    return;
  }

  if (role === "buyer") {
    const existing = await ctx.db
      .query("buyerProfiles")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();

    const patch = {
      userId,
      businessName: args.businessName as string,
      address: args.address as string,
      categoriesInterested: (args.categoriesInterested as string[]) ?? [],
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("buyerProfiles", patch);
    return;
  }

  const existing = await ctx.db
    .query("agentProfiles")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .unique();

  const patch = {
    userId,
    fullName: (args.fullName as string) ?? (args.name as string),
    businessName: args.businessName as string | undefined,
    address: args.address as string,
    serviceDescription: args.serviceDescription as string | undefined,
    preferredCategories: (args.preferredCategories as string[]) ?? [],
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return;
  }

  await ctx.db.insert("agentProfiles", patch);
}
