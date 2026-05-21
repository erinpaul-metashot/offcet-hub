import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, withImageUrls } from "./helpers";

const DASHBOARD_BUCKETS = 6;

function toMonthBucketLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(timestamp);
}

function buildMonthBuckets(values: number[]) {
  const now = new Date();
  const buckets = Array.from({ length: DASHBOARD_BUCKETS }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (DASHBOARD_BUCKETS - 1 - index), 1);

    return {
      label: toMonthBucketLabel(date.getTime()),
      month: date.getMonth(),
      year: date.getFullYear(),
      value: 0,
    };
  });

  for (const value of values) {
    const date = new Date(value);
    const bucket = buckets.find(
      (entry) => entry.month === date.getMonth() && entry.year === date.getFullYear(),
    );

    if (bucket) {
      bucket.value += 1;
    }
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["supplier"]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createDraft = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    location: v.string(),
    expectedPrice: v.optional(v.number()),
    expiresAt: v.number(),
    imageStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["supplier"]);

    return await ctx.db.insert("lots", {
      supplierUserId: viewer.user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      location: args.location,
      expectedPrice: args.expectedPrice,
      expiresAt: args.expiresAt,
      imageStorageIds: args.imageStorageIds,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateDraft = mutation({
  args: {
    lotId: v.id("lots"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    location: v.string(),
    expectedPrice: v.optional(v.number()),
    expiresAt: v.number(),
    imageStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["supplier"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot || lot.supplierUserId !== viewer.user._id) {
      throw new Error("Lot not found.");
    }

    if (lot.status !== "draft") {
      throw new Error("Only draft lots can be edited.");
    }

    await ctx.db.patch(args.lotId, {
      title: args.title,
      description: args.description,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      location: args.location,
      expectedPrice: args.expectedPrice,
      expiresAt: args.expiresAt,
      imageStorageIds: args.imageStorageIds,
      updatedAt: Date.now(),
    });
  },
});

export const submitForReview = mutation({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["supplier"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot || lot.supplierUserId !== viewer.user._id) {
      throw new Error("Lot not found.");
    }

    if (lot.status !== "draft") {
      throw new Error("Only draft lots can be submitted.");
    }

    await ctx.db.patch(args.lotId, {
      status: "pending_review",
      updatedAt: Date.now(),
      reviewNotes: undefined,
    });
  },
});

export const markSold = mutation({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["supplier"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot || lot.supplierUserId !== viewer.user._id) {
      throw new Error("Lot not found.");
    }

    await ctx.db.patch(args.lotId, {
      status: "sold",
      updatedAt: Date.now(),
    });
  },
});

export const listForSupplier = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ["supplier"]);
    const lots = await ctx.db
      .query("lots")
      .withIndex("by_supplier", (query) => query.eq("supplierUserId", viewer.user._id))
      .collect();

    const decorated = await Promise.all(
      lots
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(async (lot) => {
          const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_lot", (query) => query.eq("lotId", lot._id))
            .collect();

          return {
            ...lot,
            imageUrls: await withImageUrls(ctx, lot.imageStorageIds),
            assignmentCount: assignments.length,
          };
        }),
    );

    return decorated;
  },
});

export const get = query({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    // Basic auth check
    await requireRole(ctx, ["admin", "supplier", "buyer", "agent"]);
    
    const lot = await ctx.db.get(args.lotId);
    if (!lot) {
      return null;
    }

    const supplier = await ctx.db.get(lot.supplierUserId);
    const imageUrls = await withImageUrls(ctx, lot.imageStorageIds);

    return {
      ...lot,
      supplierName: supplier?.name ?? "Supplier",
      imageUrls,
    };
  },
});

export const getSupplierDashboard = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ["supplier"]);
    const lots = await ctx.db
      .query("lots")
      .withIndex("by_supplier", (query) => query.eq("supplierUserId", viewer.user._id))
      .collect();

    const lotRows = await Promise.all(
      lots.map(async (lot) => {
        const assignments = await ctx.db
          .query("assignments")
          .withIndex("by_lot", (query) => query.eq("lotId", lot._id))
          .collect();

        const responseSummary = assignments.reduce(
          (summary, assignment) => {
            const status = assignment.responseStatus ?? "pending";
            summary[status] += 1;
            return summary;
          },
          { pending: 0, interested: 0, not_interested: 0 },
        );

        return {
          ...lot,
          assignmentCount: assignments.length,
          responseSummary,
        };
      }),
    );

    const statusBreakdown = [
      { label: "Draft", value: lotRows.filter((lot) => lot.status === "draft").length },
      { label: "Pending", value: lotRows.filter((lot) => lot.status === "pending_review").length, tone: "accent" as const },
      { label: "Approved", value: lotRows.filter((lot) => lot.status === "approved").length, tone: "accent" as const },
      { label: "Assigned", value: lotRows.filter((lot) => lot.status === "assigned").length, tone: "accent" as const },
      { label: "Sold", value: lotRows.filter((lot) => lot.status === "sold").length },
      { label: "Expired", value: lotRows.filter((lot) => lot.status === "expired").length },
    ];

    const categoryCounts = lotRows.reduce<Record<string, number>>((summary, lot) => {
      summary[lot.category] = (summary[lot.category] ?? 0) + 1;
      return summary;
    }, {});

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([label, value]) => ({ label, value, tone: "accent" as const }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);

    const responseBreakdown = lotRows.reduce(
      (summary, lot) => {
        summary.pending += lot.responseSummary.pending;
        summary.interested += lot.responseSummary.interested;
        summary.notInterested += lot.responseSummary.not_interested;
        return summary;
      },
      { pending: 0, interested: 0, notInterested: 0 },
    );

    const activeLots = lotRows.filter(
      (lot) => lot.status === "approved" || lot.status === "assigned" || lot.status === "pending_review",
    );
    const totalExpectedValue = activeLots.reduce(
      (sum, lot) => sum + (lot.expectedPrice ?? 0),
      0,
    );

    return {
      summary: {
        totalLots: lotRows.length,
        activeLots: activeLots.length,
        draftLots: statusBreakdown[0].value,
        soldLots: statusBreakdown[4].value,
        totalExpectedValue,
        totalAssignments: lotRows.reduce((sum, lot) => sum + lot.assignmentCount, 0),
        interestedResponses: responseBreakdown.interested,
      },
      charts: {
        statusBreakdown,
        categoryBreakdown,
        lotTrend: buildMonthBuckets(lotRows.map((lot) => lot.createdAt)),
        responseBreakdown: [
          { label: "Pending", value: responseBreakdown.pending, tone: "accent" as const },
          { label: "Interested", value: responseBreakdown.interested, tone: "accent" as const },
          { label: "Not Interested", value: responseBreakdown.notInterested },
        ],
      },
      lists: {
        expiringLots: [...activeLots]
          .sort((left, right) => left.expiresAt - right.expiresAt)
          .slice(0, 5)
          .map((lot) => ({
            _id: lot._id,
            title: lot.title,
            status: lot.status,
            expiresAt: lot.expiresAt,
            location: lot.location,
            ...(lot.expectedPrice !== undefined ? { expectedPrice: lot.expectedPrice } : {}),
          })),
        recentLots: [...lotRows]
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 5)
          .map((lot) => ({
            _id: lot._id,
            title: lot.title,
            status: lot.status,
            updatedAt: lot.updatedAt,
            assignmentCount: lot.assignmentCount,
            category: lot.category,
            ...(lot.expectedPrice !== undefined ? { expectedPrice: lot.expectedPrice } : {}),
          })),
      },
    };
  },
});
