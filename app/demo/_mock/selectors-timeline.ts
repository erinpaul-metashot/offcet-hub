/**
 * Timeline reads, scoped by role.
 *
 * Three projections over the same event spine:
 *   getEntityTimeline — one record's own history
 *   getThreadTimeline — the whole cross-entity story a record belongs to
 *   getRoleTimeline   — "what happened in my world"
 *
 * Role scoping is a product rule, not a rendering detail: an event the viewer
 * may not see is never in the returned array (05_SYSTEM_DESIGN §6.2).
 */

import { orgName } from "./selectors-shared";
import {
  auditToEvent,
  milestoneToEvent,
  movementToEvent,
  sortEvents,
  type TimelineEvent,
} from "./timeline";
import type { AuditEntry, Id, MockDatabase } from "./types";
import { isAdmin, type ViewerScope } from "./visibility";

export interface EntityRef {
  table: string;
  id: Id;
}

/* ------------------------------------------------------------------ *
 * Thread resolution: the cross-entity join
 * ------------------------------------------------------------------ */

/** Every record connected to the anchor, walked in both directions. */
export function resolveThread(db: MockDatabase, anchor: EntityRef): EntityRef[] {
  const projects = new Set<Id>();
  const requests = new Set<Id>();
  const matches = new Set<Id>();
  const batches = new Set<Id>();
  const allocations = new Set<Id>();
  const productions = new Set<Id>();

  switch (anchor.table) {
    case "projects":
      projects.add(anchor.id);
      break;
    case "resourceRequests":
      requests.add(anchor.id);
      break;
    case "matches":
      matches.add(anchor.id);
      break;
    case "resourceBatches":
      batches.add(anchor.id);
      break;
    case "allocations":
      allocations.add(anchor.id);
      break;
    case "productionBatches":
      productions.add(anchor.id);
      break;
    default:
      return [anchor];
  }

  /* Grow the sets until nothing new is discovered: the graph is small and
     the fixed point is reached in two or three passes. */
  for (let pass = 0; pass < 4; pass += 1) {
    const before =
      projects.size + requests.size + matches.size + batches.size + allocations.size + productions.size;

    for (const request of db.resourceRequests) {
      if (request.projectId && projects.has(request.projectId)) requests.add(request._id);
      if (requests.has(request._id) && request.projectId) projects.add(request.projectId);
    }

    for (const match of db.matches) {
      if (requests.has(match.requestId) || batches.has(match.batchId)) matches.add(match._id);
      if (matches.has(match._id)) {
        requests.add(match.requestId);
        batches.add(match.batchId);
      }
    }

    for (const allocation of db.allocations) {
      const linked =
        batches.has(allocation.batchId) ||
        (allocation.matchId !== undefined && matches.has(allocation.matchId)) ||
        (allocation.requestId !== undefined && requests.has(allocation.requestId)) ||
        (allocation.projectId !== undefined && projects.has(allocation.projectId));

      if (linked) allocations.add(allocation._id);

      if (allocations.has(allocation._id)) {
        batches.add(allocation.batchId);
        if (allocation.matchId) matches.add(allocation.matchId);
        if (allocation.requestId) requests.add(allocation.requestId);
        if (allocation.projectId) projects.add(allocation.projectId);
      }
    }

    for (const production of db.productionBatches) {
      if (allocations.has(production.allocationId) || batches.has(production.batchId)) {
        productions.add(production._id);
      }

      if (productions.has(production._id)) {
        batches.add(production.batchId);
        allocations.add(production.allocationId);
        if (production.projectId) projects.add(production.projectId);
      }
    }

    const after =
      projects.size + requests.size + matches.size + batches.size + allocations.size + productions.size;

    if (after === before) break;
  }

  return [
    ...[...projects].map((id) => ({ table: "projects", id })),
    ...[...requests].map((id) => ({ table: "resourceRequests", id })),
    ...[...matches].map((id) => ({ table: "matches", id })),
    ...[...batches].map((id) => ({ table: "resourceBatches", id })),
    ...[...allocations].map((id) => ({ table: "allocations", id })),
    ...[...productions].map((id) => ({ table: "productionBatches", id })),
  ];
}

/* ------------------------------------------------------------------ *
 * Role scoping
 * ------------------------------------------------------------------ */

/** Records a viewer's role lets them see at all. Mirrors the selectors. */
export function canSeeEntity(db: MockDatabase, viewer: ViewerScope, ref: EntityRef): boolean {
  if (isAdmin(viewer)) {
    return true;
  }

  const { orgId, role } = viewer;

  const allocationTouchesUs = (id: Id) => {
    const allocation = db.allocations.find((row) => row._id === id);
    return allocation ? allocation.fromOrgId === orgId || allocation.toOrgId === orgId : false;
  };

  const batchTouchesUs = (id: Id) => {
    const batch = db.resourceBatches.find((row) => row._id === id);

    if (batch?.ownerOrgId === orgId) {
      return true;
    }

    return db.allocations.some(
      (allocation) =>
        allocation.batchId === id &&
        (allocation.fromOrgId === orgId ||
          allocation.toOrgId === orgId ||
          (role === "brand" &&
            allocation.projectId !== undefined &&
            projectIsOurs(allocation.projectId))),
    );
  };

  const projectIsOurs = (id: Id) =>
    db.projects.some((project) => project._id === id && project.brandOrgId === orgId);

  const requestIsOurs = (id: Id) => {
    const request = db.resourceRequests.find((row) => row._id === id);
    return request
      ? request.requesterOrgId === orgId ||
          (request.projectId !== undefined && projectIsOurs(request.projectId))
      : false;
  };

  switch (ref.table) {
    case "projects":
      return projectIsOurs(ref.id);

    case "resourceRequests":
      return requestIsOurs(ref.id);

    case "matches": {
      const match = db.matches.find((row) => row._id === ref.id);
      if (!match) return false;
      /* A manufacturer sees matches proposed against their own material; a
         brand sees matches against their own request. Nobody sees both sides
         they are not part of. */
      return requestIsOurs(match.requestId) || batchOwnedByUs(db, match.batchId, orgId);
    }

    case "resourceBatches":
      return batchTouchesUs(ref.id);

    case "allocations": {
      if (allocationTouchesUs(ref.id)) return true;
      const allocation = db.allocations.find((row) => row._id === ref.id);
      return role === "brand" && allocation?.projectId !== undefined
        ? projectIsOurs(allocation.projectId)
        : false;
    }

    case "productionBatches": {
      const production = db.productionBatches.find((row) => row._id === ref.id);
      if (!production) return false;
      if (production.makerOrgId === orgId) return true;
      return role === "brand" && production.projectId !== undefined
        ? projectIsOurs(production.projectId)
        : false;
    }

    case "organisations":
    case "users":
      return ref.id === orgId || db.users.some((user) => user._id === ref.id && user.orgId === orgId);

    default:
      return false;
  }
}

function batchOwnedByUs(db: MockDatabase, batchId: Id, orgId: Id): boolean {
  return db.resourceBatches.some((batch) => batch._id === batchId && batch.ownerOrgId === orgId);
}

/**
 * Fields `visibility.ts` strips from the record itself. A change *to* one of
 * them is the same secret in narrative form, so the whole event is withheld
 * rather than redacted — a row reading "updated estimated value" already leaks
 * that a price exists and moved.
 */
const PROTECTED_FIELDS = new Set([
  "estimatedValue",
  "taxId",
  "registrationNumber",
  "contactName",
  "contactEmail",
  "phone",
  "email",
  "supplierName",
  "cost",
  "currency",
]);

function auditIsProtected(viewer: ViewerScope, entry: AuditEntry): boolean {
  if (isAdmin(viewer) || entry.actorOrgId === viewer.orgId) {
    return false;
  }

  return (entry.fieldChanges ?? []).some((change) => PROTECTED_FIELDS.has(change.field));
}

/* ------------------------------------------------------------------ *
 * Event collection
 * ------------------------------------------------------------------ */

/** Every event attached to the given records, before record-level scoping. */
function collectEvents(db: MockDatabase, refs: EntityRef[], viewer: ViewerScope): TimelineEvent[] {
  const role = viewer.role;
  const keys = new Set(refs.map((ref) => `${ref.table}:${ref.id}`));
  const batchIds = new Set(refs.filter((ref) => ref.table === "resourceBatches").map((ref) => ref.id));
  const projectIds = new Set(refs.filter((ref) => ref.table === "projects").map((ref) => ref.id));

  const fromAudit = db.auditLog
    .filter(
      (entry) =>
        keys.has(`${entry.entityTable}:${entry.entityId}`) ||
        (entry.parentEntityTable !== undefined &&
          entry.parentEntityId !== undefined &&
          keys.has(`${entry.parentEntityTable}:${entry.parentEntityId}`)),
    )
    .filter((entry) => !auditIsProtected(viewer, entry))
    .map((entry) => auditToEvent(db, entry, role))
    .filter((event): event is TimelineEvent => event !== undefined);

  const fromMovements = db.quantityMovements
    .filter((movement) => batchIds.has(movement.batchId))
    .map((movement) => movementToEvent(db, movement, role));

  const fromMilestones = db.projectMilestones
    .filter((milestone) => projectIds.has(milestone.projectId))
    .map((milestone) => milestoneToEvent(db, milestone, role))
    .filter((event): event is TimelineEvent => event !== undefined);

  return [...fromAudit, ...fromMovements, ...fromMilestones];
}

function scopeEvents(
  db: MockDatabase,
  viewer: ViewerScope,
  events: TimelineEvent[],
): TimelineEvent[] {
  return events.filter((event) =>
    canSeeEntity(db, viewer, { table: event.entityTable, id: event.entityId }),
  );
}

/* ------------------------------------------------------------------ *
 * The three projections
 * ------------------------------------------------------------------ */

/** One record's own history: the "History" panel on a detail screen. */
export function getEntityTimeline(
  db: MockDatabase,
  viewer: ViewerScope,
  entityTable: string,
  entityId: Id,
): TimelineEvent[] {
  const refs: EntityRef[] = [{ table: entityTable, id: entityId }];
  return sortEvents(scopeEvents(db, viewer, collectEvents(db, refs, viewer)));
}

export interface ThreadTimeline {
  title: string;
  subtitle?: string;
  anchor: EntityRef;
  events: TimelineEvent[];
  /** Organisations that held the material, in the order they held it. */
  custodyChain: Array<{ orgId: Id; name: string }>;
  /**
   * Admin only. How much of this thread the brand on the other side cannot see:
   * the permission matrix made visible, as a count and never as content.
   */
  hiddenFromBrand?: { orgName: string; count: number };
}

/** The whole cross-entity story a record belongs to. The flagship view. */
export function getThreadTimeline(
  db: MockDatabase,
  viewer: ViewerScope,
  anchor: EntityRef,
): ThreadTimeline {
  const refs = resolveThread(db, anchor);
  const all = collectEvents(db, refs, viewer);
  const events = sortEvents(scopeEvents(db, viewer, all));

  return {
    ...threadHeading(db, anchor, refs),
    anchor,
    events,
    custodyChain: custodyChainFor(db, anchor, refs, events),
    hiddenFromBrand: isAdmin(viewer) ? countHiddenFromBrand(db, refs, all) : undefined,
  };
}

/**
 * Who held the material, in the order they held it.
 *
 * Derived from one batch: a thread anchored on a project can span several
 * materials, and interleaving their custody produces a chain that describes no
 * physical journey at all.
 */
// ponytail: one chain per thread. Chain per batch if a project screen ever
// needs to show every material's route side by side.
function custodyChainFor(
  db: MockDatabase,
  anchor: EntityRef,
  refs: EntityRef[],
  events: TimelineEvent[],
): Array<{ orgId: Id; name: string }> {
  const batchId =
    anchor.table === "resourceBatches"
      ? anchor.id
      : refs.find((ref) => ref.table === "resourceBatches")?.id;

  if (!batchId) {
    return [];
  }

  const chain: Array<{ orgId: Id; name: string }> = [];

  for (const event of [...events].reverse()) {
    const orgId = event.custodyOrgId;

    if (
      orgId &&
      event.entityId === batchId &&
      chain[chain.length - 1]?.orgId !== orgId
    ) {
      chain.push({ orgId, name: orgName(db, orgId) });
    }
  }

  return chain;
}

function threadHeading(
  db: MockDatabase,
  anchor: EntityRef,
  refs: EntityRef[],
): { title: string; subtitle?: string } {
  const batchRef = refs.find((ref) => ref.table === "resourceBatches");
  const projectRef = refs.find((ref) => ref.table === "projects");
  const batch = batchRef ? db.resourceBatches.find((row) => row._id === batchRef.id) : undefined;
  const project = projectRef ? db.projects.find((row) => row._id === projectRef.id) : undefined;

  if (anchor.table === "projects" && project) {
    return { title: project.title, subtitle: batch ? `Material: ${batch.name}` : undefined };
  }

  if (batch) {
    return { title: batch.name, subtitle: project ? `Project: ${project.title}` : undefined };
  }

  return { title: "Journey", subtitle: undefined };
}

function countHiddenFromBrand(
  db: MockDatabase,
  refs: EntityRef[],
  all: TimelineEvent[],
): { orgName: string; count: number } | undefined {
  const projectRef = refs.find((ref) => ref.table === "projects");
  const project = projectRef ? db.projects.find((row) => row._id === projectRef.id) : undefined;

  if (!project) {
    return undefined;
  }

  const brandViewer: ViewerScope = {
    userId: "",
    orgId: project.brandOrgId,
    role: "brand",
  };

  const visible = scopeEvents(db, brandViewer, all).length;

  return { orgName: orgName(db, project.brandOrgId), count: all.length - visible };
}

/** "What happened in my world" — the dashboard activity feed. */
export function getRoleTimeline(
  db: MockDatabase,
  viewer: ViewerScope,
  options: { since?: number; limit?: number } = {},
): TimelineEvent[] {
  const { since, limit = 12 } = options;

  const everything: EntityRef[] = [
    ...db.projects.map((row) => ({ table: "projects", id: row._id })),
    ...db.resourceRequests.map((row) => ({ table: "resourceRequests", id: row._id })),
    ...db.matches.map((row) => ({ table: "matches", id: row._id })),
    ...db.resourceBatches.map((row) => ({ table: "resourceBatches", id: row._id })),
    ...db.allocations.map((row) => ({ table: "allocations", id: row._id })),
    ...db.productionBatches.map((row) => ({ table: "productionBatches", id: row._id })),
    ...db.organisations.map((row) => ({ table: "organisations", id: row._id })),
    ...db.users.map((row) => ({ table: "users", id: row._id })),
  ];

  const mine = everything.filter((ref) => canSeeEntity(db, viewer, ref));
  const events = sortEvents(scopeEvents(db, viewer, collectEvents(db, mine, viewer)));
  const recent = since ? events.filter((event) => event.occurredAt >= since) : events;

  return recent.slice(0, limit);
}
