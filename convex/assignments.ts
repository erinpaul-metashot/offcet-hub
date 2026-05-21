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

export const assignLot = mutation({
  args: {
    lotId: v.id("lots"),
    assignedToIds: v.array(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot) {
      throw new Error("Lot not found.");
    }

    const existingAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_lot", (query) => query.eq("lotId", args.lotId))
      .collect();

    const existingAssignees = new Set(
      existingAssignments.map((assignment) => assignment.assignedToUserId),
    );

    for (const assigneeId of args.assignedToIds) {
      if (existingAssignees.has(assigneeId)) {
        continue;
      }

      const assignee = await ctx.db.get(assigneeId);
      if (!assignee || !["buyer", "agent"].includes(assignee.role)) {
        continue;
      }

      await ctx.db.insert("assignments", {
        lotId: args.lotId,
        assignedByUserId: viewer.user._id,
        assignedToUserId: assigneeId,
        assignedAt: Date.now(),
        notes: args.notes,
        responseStatus: "pending",
      });
    }

    await ctx.db.patch(args.lotId, {
      status: "assigned",
      updatedAt: Date.now(),
    });
  },
});

export const listAssignedLotsForCurrentUser = query({
  args: {
    searchText: v.optional(v.string()),
    locationText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["buyer", "agent"]);
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assigned_to", (query) => query.eq("assignedToUserId", viewer.user._id))
      .collect();

    const normalizedSearch = args.searchText?.trim().toLowerCase() ?? "";
    const normalizedLocation = args.locationText?.trim().toLowerCase() ?? "";

    const lots = await Promise.all(
      assignments.map(async (assignment) => {
        const lot = await ctx.db.get(assignment.lotId);

        if (!lot) {
          return null;
        }

        const supplier = await ctx.db.get(lot.supplierUserId);
        const imageUrls = await withImageUrls(ctx, lot.imageStorageIds);

        return {
          ...lot,
          assignmentId: assignment._id,
          imageUrls,
          supplierName: supplier?.name ?? "Supplier",
          assignedAt: assignment.assignedAt,
          assignmentNotes: assignment.notes,
          responseStatus: assignment.responseStatus ?? "pending",
          responseUpdatedAt: assignment.responseUpdatedAt,
        };
      }),
    );

    return lots
      .filter((lot): lot is NonNullable<typeof lot> => Boolean(lot))
      .filter((lot) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [lot.title, lot.description, lot.category].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );

        const matchesLocation =
          normalizedLocation.length === 0 ||
          lot.location.toLowerCase().includes(normalizedLocation);

        return matchesSearch && matchesLocation;
      })
      .sort((left, right) => right.assignedAt - left.assignedAt);
  },
});

export const respondToAssignment = mutation({
  args: {
    lotId: v.id("lots"),
    responseStatus: v.union(v.literal("interested"), v.literal("not_interested")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["buyer"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot) {
      throw new Error("Lot not found.");
    }

    if (lot.status !== "assigned") {
      throw new Error("This lot is no longer available for a response.");
    }

    const assignment = await ctx.db
      .query("assignments")
      .withIndex("by_lot_and_assigned_to", (query) =>
        query.eq("lotId", args.lotId).eq("assignedToUserId", viewer.user._id),
      )
      .unique();

    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    await ctx.db.patch(assignment._id, {
      responseStatus: args.responseStatus,
      responseUpdatedAt: Date.now(),
      responseUpdatedByUserId: viewer.user._id,
    });
  },
});

export const unassignLot = mutation({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    const lotId = assignment.lotId;

    // Delete the assignment
    await ctx.db.delete(args.assignmentId);

    // If there are no assignments left for this lot, change its status back to "approved"
    const remainingAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_lot", (query) => query.eq("lotId", lotId))
      .collect();

    if (remainingAssignments.length === 0) {
      await ctx.db.patch(lotId, {
        status: "approved",
        updatedAt: Date.now(),
      });
    }
  },
});

export const getBuyerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ["buyer"]);
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assigned_to", (query) => query.eq("assignedToUserId", viewer.user._id))
      .collect();

    const assignmentLots = (
      await Promise.all(
        assignments.map(async (assignment) => {
          const lot = await ctx.db.get(assignment.lotId);

          if (!lot) {
            return null;
          }

          const supplier = await ctx.db.get(lot.supplierUserId);

          return {
            assignmentId: assignment._id,
            assignedAt: assignment.assignedAt,
            responseStatus: assignment.responseStatus ?? "pending",
            title: lot.title,
            category: lot.category,
            location: lot.location,
            expectedPrice: lot.expectedPrice,
            expiresAt: lot.expiresAt,
            status: lot.status,
            supplierName: supplier?.name ?? "Supplier",
            lotId: lot._id,
          };
        }),
      )
    ).filter((value): value is NonNullable<typeof value> => value !== null);

    const responseBreakdown = [
      {
        label: "Pending",
        value: assignmentLots.filter((item) => item.responseStatus === "pending").length,
        tone: "accent" as const,
      },
      {
        label: "Interested",
        value: assignmentLots.filter((item) => item.responseStatus === "interested").length,
        tone: "accent" as const,
      },
      {
        label: "Not Interested",
        value: assignmentLots.filter((item) => item.responseStatus === "not_interested").length,
      },
    ];

    const categoryCounts = assignmentLots.reduce<Record<string, number>>((summary, item) => {
      summary[item.category] = (summary[item.category] ?? 0) + 1;
      return summary;
    }, {});

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([label, value]) => ({ label, value, tone: "accent" as const }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);

    const activeAssignments = assignmentLots.filter(
      (item) => item.status === "assigned" || item.status === "approved",
    );
    const expiringSoon = [...activeAssignments]
      .sort((left, right) => left.expiresAt - right.expiresAt)
      .slice(0, 5);

    const totalPipelineValue = activeAssignments.reduce(
      (sum, item) => sum + (item.expectedPrice ?? 0),
      0,
    );

    return {
      summary: {
        assignedLots: assignmentLots.length,
        activeLots: activeAssignments.length,
        totalPipelineValue,
        pendingResponses: responseBreakdown[0].value,
        interestedLots: responseBreakdown[1].value,
        expiringSoon: expiringSoon.length,
      },
      charts: {
        responseBreakdown,
        categoryBreakdown,
        assignmentTrend: buildMonthBuckets(assignmentLots.map((item) => item.assignedAt)),
      },
      lists: {
        urgentLots: expiringSoon,
        recentAssignments: [...assignmentLots]
          .sort((left, right) => right.assignedAt - left.assignedAt)
          .slice(0, 5),
      },
    };
  },
});
