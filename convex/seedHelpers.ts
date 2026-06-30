import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Returns true if demo data has already been inserted (guards against double-seeding).
 */
export const isAlreadySeeded = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "supplier1@gmail.com"))
      .unique();
    return Boolean(existing);
  },
});

/**
 * Generates a signed Convex storage upload URL.
 * Must be a mutation — storage.generateUploadUrl() is not available in actions.
 */
export const getUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Returns the _id of the single admin user, or null if none exists.
 */
export const getAdminUserId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .unique();
    return admin?._id ?? null;
  },
});

/**
 * Patches a user's status (pending / approved / rejected).
 * Used to override the default "pending" set by finalizeRegistration.
 */
export const patchUserStatus = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { status: args.status });
  },
});

/**
 * Directly inserts a lot with an explicit status.
 * Used by the seed to create lots in every possible status state.
 */
export const insertLot = internalMutation({
  args: {
    supplierUserId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    location: v.string(),
    expectedPrice: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("assigned"),
      v.literal("sold"),
      v.literal("expired"),
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lots", {
      supplierUserId: args.supplierUserId,
      title: args.title,
      description: args.description,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      imageStorageIds: args.imageStorageIds,
      location: args.location,
      expectedPrice: args.expectedPrice,
      status: args.status,
      expiresAt: args.expiresAt,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    });
  },
});

/**
 * Directly inserts an assignment record.
 * Used by the seed to place buyers on the "assigned" lot with preset responses.
 */
export const insertAssignment = internalMutation({
  args: {
    lotId: v.id("lots"),
    assignedByUserId: v.id("users"),
    assignedToUserId: v.id("users"),
    assignedAt: v.number(),
    notes: v.optional(v.string()),
    responseStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("interested"),
        v.literal("not_interested"),
      ),
    ),
    responseUpdatedAt: v.optional(v.number()),
    responseUpdatedByUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignments", {
      lotId: args.lotId,
      assignedByUserId: args.assignedByUserId,
      assignedToUserId: args.assignedToUserId,
      assignedAt: args.assignedAt,
      notes: args.notes,
      responseStatus: args.responseStatus,
      responseUpdatedAt: args.responseUpdatedAt,
      responseUpdatedByUserId: args.responseUpdatedByUserId,
    });
  },
});

/**
 * Returns all non-admin users whose email ends with the given domain string.
 * Used by resetSeedData to locate every record that needs to be cleaned up.
 */
export const getSeedUsersByDomain = internalQuery({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").take(200);
    return allUsers.filter(
      (u) => u.email.endsWith(args.domain) && u.role !== "admin",
    );
  },
});

/**
 * Cascade-deletes a single user and all their data from Convex:
 * their lots → those lots' assignments → buyer/agent assignments → role profile → user record.
 */
export const deleteSeedUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Delete supplier lots and every assignment on those lots
    const lots = await ctx.db
      .query("lots")
      .withIndex("by_supplier", (q) => q.eq("supplierUserId", args.userId))
      .collect();

    for (const lot of lots) {
      const lotAssignments = await ctx.db
        .query("assignments")
        .withIndex("by_lot", (q) => q.eq("lotId", lot._id))
        .collect();
      for (const a of lotAssignments) await ctx.db.delete(a._id);
      await ctx.db.delete(lot._id);
    }

    // Delete buyer/agent assignments (where this user is the assignee)
    const userAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_assigned_to", (q) => q.eq("assignedToUserId", args.userId))
      .collect();
    for (const a of userAssignments) await ctx.db.delete(a._id);

    // Delete role profile
    if (user.role === "supplier") {
      const profile = await ctx.db
        .query("supplierProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();
      if (profile) await ctx.db.delete(profile._id);
    } else if (user.role === "buyer") {
      const profile = await ctx.db
        .query("buyerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();
      if (profile) await ctx.db.delete(profile._id);
    } else if (user.role === "agent") {
      const profile = await ctx.db
        .query("agentProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();
      if (profile) await ctx.db.delete(profile._id);
    }

    await ctx.db.delete(args.userId);
  },
});
