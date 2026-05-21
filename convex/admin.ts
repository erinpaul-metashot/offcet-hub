import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireRole, withImageUrls } from "./helpers";

const USER_FETCH_LIMIT = 200;
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

async function getUserProfileSummary(
  ctx: QueryCtx,
  user: Doc<"users">,
) {
  switch (user.role) {
    case "supplier": {
      const profile = await ctx.db
        .query("supplierProfiles")
        .withIndex("by_user", (query) => query.eq("userId", user._id))
        .unique();

      if (!profile) {
        return "Supplier profile incomplete";
      }

      return `${profile.companyName} - ${profile.goodsTypes.length} goods categories`;
    }
    case "buyer": {
      const profile = await ctx.db
        .query("buyerProfiles")
        .withIndex("by_user", (query) => query.eq("userId", user._id))
        .unique();

      if (!profile) {
        return "Buyer profile incomplete";
      }

      return `${profile.businessName} - ${profile.categoriesInterested.length} interest categories`;
    }
    case "agent": {
      const profile = await ctx.db
        .query("agentProfiles")
        .withIndex("by_user", (query) => query.eq("userId", user._id))
        .unique();

      if (!profile) {
        return "Agent profile incomplete";
      }

      return profile.businessName
        ? `${profile.fullName} - ${profile.businessName}`
        : profile.fullName;
    }
    case "admin":
      return "Platform administrator";
  }
}

async function getDeleteGuard(
  ctx: QueryCtx,
  user: Doc<"users">,
  viewerUserId: Id<"users">,
) {
  if (user._id === viewerUserId) {
    return {
      canDelete: false,
      deleteBlockReason: "Your own account cannot be deleted.",
    };
  }

  if (user.role === "admin") {
    return {
      canDelete: false,
      deleteBlockReason: "Admin accounts are protected from deletion.",
    };
  }

  return {
    canDelete: true,
    deleteBlockReason: undefined,
  };
}

async function toManagedUser(
  ctx: QueryCtx,
  user: Doc<"users">,
  viewerUserId: Id<"users">,
) {
  const [profileSummary, deleteGuard] = await Promise.all([
    getUserProfileSummary(ctx, user),
    getDeleteGuard(ctx, user, viewerUserId),
  ]);

  return {
    ...user,
    profileSummary,
    ...deleteGuard,
  };
}

async function removeRoleProfile(ctx: MutationCtx, user: Doc<"users">) {
  if (user.role === "supplier") {
    const profile = await ctx.db
      .query("supplierProfiles")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }

    return;
  }

  if (user.role === "buyer") {
    const profile = await ctx.db
      .query("buyerProfiles")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }

    return;
  }

  if (user.role === "agent") {
    const profile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }
  }
}

export const getUserManagementView = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ["admin"]);

    const [pendingUsers, approvedUsers, rejectedUsers] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_status", (query) => query.eq("status", "pending"))
        .take(USER_FETCH_LIMIT),
      ctx.db
        .query("users")
        .withIndex("by_status", (query) => query.eq("status", "approved"))
        .take(USER_FETCH_LIMIT),
      ctx.db
        .query("users")
        .withIndex("by_status", (query) => query.eq("status", "rejected"))
        .take(USER_FETCH_LIMIT),
    ]);

    const sortedPendingUsers = pendingUsers.sort((left, right) => right.createdAt - left.createdAt);
    const sortedManagedUsers = [...approvedUsers, ...rejectedUsers].sort(
      (left, right) => right.createdAt - left.createdAt,
    );

    const [managedUsers, pendingRequests] = await Promise.all([
      Promise.all(
        sortedManagedUsers.map((user) => toManagedUser(ctx, user, viewer.user._id)),
      ),
      Promise.all(
        sortedPendingUsers.map((user) => toManagedUser(ctx, user, viewer.user._id)),
      ),
    ]);

    return {
      managedUsers,
      pendingRequests,
      counts: {
        approved: approvedUsers.length,
        pending: pendingUsers.length,
        rejected: rejectedUsers.length,
        total: approvedUsers.length + pendingUsers.length + rejectedUsers.length,
      },
    };
  },
});

export const listPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);

    const users = await ctx.db
      .query("users")
      .withIndex("by_status", (query) => query.eq("status", "pending"))
      .take(USER_FETCH_LIMIT);

    return users.sort((left, right) => right.createdAt - left.createdAt);
  },
});

export const listAssignableUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);

    const users = await ctx.db
      .query("users")
      .withIndex("by_status", (query) => query.eq("status", "approved"))
      .take(USER_FETCH_LIMIT);

    const assignable = users
      .filter((user) => user.role === "buyer" || user.role === "agent")
      .sort((left, right) => left.name.localeCompare(right.name));

    return await Promise.all(
      assignable.map(async (user) => {
        let profile = null;
        if (user.role === "buyer") {
          profile = await ctx.db
            .query("buyerProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
        } else if (user.role === "agent") {
          profile = await ctx.db
            .query("agentProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
        }
        return {
          ...user,
          profile: profile ?? undefined,
        };
      }),
    );
  },
});

export const approveUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    await ctx.db.patch(args.userId, {
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: viewer.user._id,
      reviewNotes: undefined,
    });
  },
});

export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    await ctx.db.patch(args.userId, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: viewer.user._id,
      reviewNotes: args.reviewNotes,
    });
  },
});

export const updateUserAccount = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const trimmedName = args.name.trim();
    const trimmedPhone = args.phone.trim();
    const trimmedReviewNotes = args.reviewNotes?.trim() || undefined;

    if (trimmedName.length < 2) {
      throw new Error("Enter a valid user name.");
    }

    if (trimmedPhone.length < 7) {
      throw new Error("Enter a valid phone number.");
    }

    if (user.role === "admin" && args.status && args.status !== user.status) {
      throw new Error("Admin account approval status cannot be changed.");
    }

    const patch: {
      name: string;
      phone: string;
      reviewNotes?: string;
      status?: "pending" | "approved" | "rejected";
      reviewedAt?: number;
      reviewedBy?: Id<"users">;
    } = {
      name: trimmedName,
      phone: trimmedPhone,
      reviewNotes: trimmedReviewNotes,
    };

    if (args.status !== undefined && args.status !== user.status) {
      patch.status = args.status;

      if (args.status === "pending") {
        patch.reviewedAt = undefined;
        patch.reviewedBy = undefined;
        patch.reviewNotes = undefined;
      } else {
        patch.reviewedAt = Date.now();
        patch.reviewedBy = viewer.user._id;
        patch.reviewNotes = trimmedReviewNotes;
      }
    }

    await ctx.db.patch(args.userId, patch);
  },
});

export const deleteUserAccount = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found.");
    }

    if (user._id === viewer.user._id) {
      throw new Error("You cannot delete your own account.");
    }

    if (user.role === "admin") {
      throw new Error("Admin accounts are protected from deletion.");
    }

    // Cascade delete lots and their assignments
    const supplierLotsDocs = await ctx.db
      .query("lots")
      .withIndex("by_supplier", (query) => query.eq("supplierUserId", args.userId))
      .collect();
    for (const lot of supplierLotsDocs) {
      const lotAssignments = await ctx.db
        .query("assignments")
        .withIndex("by_lot", (query) => query.eq("lotId", lot._id))
        .collect();
      for (const assignment of lotAssignments) {
        await ctx.db.delete(assignment._id);
      }
      await ctx.db.delete(lot._id);
    }

    // Cascade delete user assignments
    const userAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_assigned_to", (query) => query.eq("assignedToUserId", args.userId))
      .collect();
    for (const assignment of userAssignments) {
      await ctx.db.delete(assignment._id);
    }

    await removeRoleProfile(ctx, user);
    await ctx.db.delete(args.userId);
  },
});

export const listPendingLots = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);

    const lots = await ctx.db
      .query("lots")
      .withIndex("by_status", (query) => query.eq("status", "pending_review"))
      .collect();

    return await Promise.all(
      lots
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(async (lot) => {
          const supplier = await ctx.db.get(lot.supplierUserId);

          return {
            ...lot,
            supplierName: supplier?.name ?? "Supplier",
            imageUrls: await withImageUrls(ctx, lot.imageStorageIds),
          };
        }),
    );
  },
});

export const listLotOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);

    const lots = await ctx.db.query("lots").collect();

    return await Promise.all(
      lots
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(async (lot) => {
          const supplier = await ctx.db.get(lot.supplierUserId);
          const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_lot", (query) => query.eq("lotId", lot._id))
            .collect();

          const buyerAssignments = await Promise.all(
            assignments.map(async (assignment) => {
              const assignee = await ctx.db.get(assignment.assignedToUserId);

              return assignee?.role === "buyer" ? assignment : null;
            }),
          );

          const responseSummary = buyerAssignments.reduce(
            (summary, assignment) => {
              if (!assignment) {
                return summary;
              }

              const responseStatus = assignment.responseStatus ?? "pending";

              if (responseStatus === "interested") {
                summary.interested += 1;
              } else if (responseStatus === "not_interested") {
                summary.notInterested += 1;
              } else {
                summary.pending += 1;
              }

              return summary;
            },
            { pending: 0, interested: 0, notInterested: 0 },
          );

          return {
            ...lot,
            supplierName: supplier?.name ?? "Supplier",
            imageUrls: await withImageUrls(ctx, lot.imageStorageIds),
            assigneeCount: assignments.length,
            responseSummary,
          };
        }),
    );
  },
});

export const approveLot = mutation({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    await ctx.db.patch(args.lotId, {
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: viewer.user._id,
      reviewNotes: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const rejectLot = mutation({
  args: {
    lotId: v.id("lots"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    await ctx.db.patch(args.lotId, {
      status: "draft",
      reviewedAt: Date.now(),
      reviewedBy: viewer.user._id,
      reviewNotes: args.reviewNotes,
      updatedAt: Date.now(),
    });
  },
});

export const unapproveLot = mutation({
  args: {
    lotId: v.id("lots"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["admin"]);
    const lot = await ctx.db.get(args.lotId);

    if (!lot) {
      throw new Error("Lot not found.");
    }

    if (lot.status !== "approved") {
      throw new Error("Only approved lots can be unapproved.");
    }

    await ctx.db.patch(args.lotId, {
      status: "pending_review",
      reviewedAt: Date.now(),
      reviewedBy: viewer.user._id,
      reviewNotes: args.reviewNotes,
      updatedAt: Date.now(),
    });
  },
});


export const listLotAssignments = query({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_lot", (query) => query.eq("lotId", args.lotId))
      .collect();

    return await Promise.all(
      assignments.map(async (assignment) => {
        const assignee = await ctx.db.get(assignment.assignedToUserId);
        return {
          ...assignment,
          assigneeName: assignee?.name ?? "Unknown User",
          assigneeRole: assignee?.role ?? "buyer",
        };
      }),
    );
  },
});

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);

    const [users, lots, assignments] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("lots").collect(),
      ctx.db.query("assignments").collect(),
    ]);

    const approvedUsers = users.filter((user) => user.status === "approved");
    const pendingUsers = users.filter((user) => user.status === "pending");
    const pendingLots = lots.filter((lot) => lot.status === "pending_review");
    const approvedLots = lots.filter((lot) => lot.status === "approved");
    const assignedLots = lots.filter((lot) => lot.status === "assigned");
    const soldLots = lots.filter((lot) => lot.status === "sold");
    const liveSupplyValue = lots.reduce(
      (sum, lot) => sum + (lot.status !== "sold" && lot.status !== "expired" ? lot.expectedPrice ?? 0 : 0),
      0,
    );

    const roleBreakdown = [
      {
        label: "Suppliers",
        value: approvedUsers.filter((user) => user.role === "supplier").length,
        tone: "accent" as const,
      },
      {
        label: "Buyers",
        value: approvedUsers.filter((user) => user.role === "buyer").length,
        tone: "accent" as const,
      },
      {
        label: "Agents",
        value: approvedUsers.filter((user) => user.role === "agent").length,
        tone: "default" as const,
      },
      {
        label: "Admins",
        value: approvedUsers.filter((user) => user.role === "admin").length,
        tone: "default" as const,
      },
    ];

    const supplyBreakdown = [
      { label: "Draft", value: lots.filter((lot) => lot.status === "draft").length },
      { label: "Pending", value: pendingLots.length, tone: "accent" as const },
      { label: "Approved", value: approvedLots.length, tone: "accent" as const },
      { label: "Assigned", value: assignedLots.length, tone: "accent" as const },
      { label: "Sold", value: soldLots.length },
      { label: "Expired", value: lots.filter((lot) => lot.status === "expired").length },
    ];

    const categoryCounts = lots.reduce<Record<string, number>>((summary, lot) => {
      summary[lot.category] = (summary[lot.category] ?? 0) + 1;
      return summary;
    }, {});

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([label, value]) => ({ label, value, tone: "accent" as const }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);

    const responseSummary = assignments.reduce(
      (summary, assignment) => {
        const status = assignment.responseStatus ?? "pending";
        summary[status] += 1;
        return summary;
      },
      { pending: 0, interested: 0, not_interested: 0 },
    );

    const pendingLotsWithSuppliers = await Promise.all(
      pendingLots
        .sort((left, right) => right.createdAt - left.createdAt)
        .slice(0, 5)
        .map(async (lot) => {
          const supplier = await ctx.db.get(lot.supplierUserId);

          return {
            _id: lot._id,
            title: lot.title,
            category: lot.category,
            createdAt: lot.createdAt,
            location: lot.location,
            supplierName: supplier?.name ?? "Supplier",
            expectedPrice: lot.expectedPrice,
          };
        }),
    );

    const pendingUsersList = pendingUsers
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 5)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        email: user.email,
      }));

    const expiringLots = await Promise.all(
      lots
        .filter((lot) => lot.status === "approved" || lot.status === "assigned")
        .sort((left, right) => left.expiresAt - right.expiresAt)
        .slice(0, 5)
        .map(async (lot) => {
          const supplier = await ctx.db.get(lot.supplierUserId);

          return {
            _id: lot._id,
            title: lot.title,
            status: lot.status,
            expiresAt: lot.expiresAt,
            location: lot.location,
            supplierName: supplier?.name ?? "Supplier",
            expectedPrice: lot.expectedPrice,
          };
        }),
    );

    return {
      summary: {
        totalUsers: users.length,
        pendingUsers: pendingUsers.length,
        pendingLots: pendingLots.length,
        liveLots: approvedLots.length + assignedLots.length,
        totalAssignments: assignments.length,
        interestedResponses: responseSummary.interested,
        liveSupplyValue,
      },
      charts: {
        roleBreakdown,
        supplyBreakdown,
        categoryBreakdown,
        lotTrend: buildMonthBuckets(lots.map((lot) => lot.createdAt)),
      },
      queues: {
        pendingUsers: pendingUsersList,
        pendingLots: pendingLotsWithSuppliers,
        expiringLots,
      },
    };
  },
});
