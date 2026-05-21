import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

type AppCtx = QueryCtx | MutationCtx;

export type AppUserDoc = Doc<"users">;

async function getProfile(
  ctx: AppCtx,
  user: AppUserDoc,
): Promise<Doc<"supplierProfiles"> | Doc<"buyerProfiles"> | Doc<"agentProfiles"> | null> {
  switch (user.role) {
    case "supplier":
      return (
        (await ctx.db
          .query("supplierProfiles")
          .withIndex("by_user", (query) => query.eq("userId", user._id))
          .unique()) ?? null
      );
    case "buyer":
      return (
        (await ctx.db
          .query("buyerProfiles")
          .withIndex("by_user", (query) => query.eq("userId", user._id))
          .unique()) ?? null
      );
    case "agent":
      return (
        (await ctx.db
          .query("agentProfiles")
          .withIndex("by_user", (query) => query.eq("userId", user._id))
          .unique()) ?? null
      );
    case "admin":
      return null;
  }
}

export async function getViewer(ctx: AppCtx) {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
  const session = await auth.api.getSession({ headers });
  const authUser = session?.user;

  if (!authUser || !("id" in authUser)) {
    return null;
  }

  const user =
    (await ctx.db
      .query("users")
      .withIndex("by_auth_user_id", (query) => query.eq("authUserId", authUser.id))
      .unique()) ?? null;

  const profile = user ? await getProfile(ctx, user) : null;

  return {
    authUser,
    user,
    profile,
  };
}

export async function requireViewer(ctx: AppCtx) {
  const viewer = await getViewer(ctx);

  if (!viewer?.user) {
    throw new Error("Authentication required.");
  }

  return viewer as {
    authUser: NonNullable<typeof viewer>["authUser"];
    user: AppUserDoc;
    profile: Awaited<ReturnType<typeof getProfile>>;
  };
}

export async function requireRole(
  ctx: AppCtx,
  roles: Array<AppUserDoc["role"]>,
) {
  const viewer = await requireViewer(ctx);

  if (viewer.user.status !== "approved") {
    throw new Error("Account approval is required.");
  }

  if (!roles.includes(viewer.user.role)) {
    throw new Error("You do not have access to this action.");
  }

  return viewer;
}

export async function withImageUrls(
  ctx: QueryCtx,
  storageIds: Id<"_storage">[],
) {
  const urls = await Promise.all(storageIds.map((storageId) => ctx.storage.getUrl(storageId)));
  return urls.filter((url): url is string => Boolean(url));
}

export function dashboardPathForRole(role: AppUserDoc["role"]) {
  return `/${role}`;
}
