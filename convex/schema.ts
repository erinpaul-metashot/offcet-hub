import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("supplier"),
      v.literal("buyer"),
      v.literal("agent"),
      v.literal("admin"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_role", ["role"]),

  supplierProfiles: defineTable({
    userId: v.id("users"),
    companyName: v.string(),
    taxId: v.string(),
    address: v.string(),
    warehouseAddress: v.optional(v.string()),
    goodsTypes: v.array(v.string()),
  }).index("by_user", ["userId"]),

  buyerProfiles: defineTable({
    userId: v.id("users"),
    businessName: v.string(),
    address: v.string(),
    categoriesInterested: v.array(v.string()),
  }).index("by_user", ["userId"]),

  agentProfiles: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    businessName: v.optional(v.string()),
    address: v.string(),
    serviceDescription: v.optional(v.string()),
    preferredCategories: v.array(v.string()),
  }).index("by_user", ["userId"]),

  lots: defineTable({
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
    updatedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_supplier", ["supplierUserId"])
    .index("by_status", ["status"])
    .index("by_expiry", ["expiresAt"]),

  assignments: defineTable({
    lotId: v.id("lots"),
    assignedByUserId: v.id("users"),
    assignedToUserId: v.id("users"),
    assignedAt: v.number(),
    notes: v.optional(v.string()),
    responseStatus: v.optional(v.union(v.literal("pending"), v.literal("interested"), v.literal("not_interested"))),
    responseUpdatedAt: v.optional(v.number()),
    responseUpdatedByUserId: v.optional(v.id("users")),
  })
    .index("by_lot", ["lotId"])
    .index("by_assigned_to", ["assignedToUserId"])
    .index("by_lot_and_assigned_to", ["lotId", "assignedToUserId"]),
});
