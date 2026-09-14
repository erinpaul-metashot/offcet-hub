/**
 * The timeline event model.
 *
 * Three sources already exist in the database and each tells part of the same
 * story: the append-only audit log (who did what), the quantity ledger (what
 * moved), and the project milestones (what was planned). This module projects
 * all three into one shape so a single component can render a record's history,
 * a whole cross-entity thread, or a role's activity feed.
 *
 * Reads live in `selectors-timeline.ts`. This file is the vocabulary.
 */

import type { ActorType, CirkaRole, QuantityBucket, Unit } from "./domain";
import { isListedLot } from "./operations/marketplace";
import { describeAudit, describeMilestone, describeMovement } from "./timeline-describe";
import type {
  AuditEntry,
  Id,
  MockDatabase,
  ProjectMilestone,
  QuantityMovement,
  Timestamp,
} from "./types";

export type TimelineSource = "audit" | "movement" | "milestone";

/** How the row reads: drives colour, never invented per-screen. */
export type TimelineTone = "neutral" | "progress" | "success" | "warning" | "aborted";

export interface TimelineQuantityDelta {
  quantity: number;
  unit: Unit;
  from: QuantityBucket | null;
  to: QuantityBucket | null;
}

export interface TimelineEvent {
  id: Id;
  occurredAt: Timestamp;
  source: TimelineSource;
  /** The record this happened to: drives the deep link and the thread join. */
  entityTable: string;
  entityId: Id;
  actorUserId?: Id;
  actorOrgId?: Id;
  actorRole?: CirkaRole;
  actorType: ActorType;
  /** A sentence, not "status_changed · allocations". */
  headline: string;
  /** The batch a quantity movement happened to, named after the headline. */
  subject?: string;
  detail?: string;
  quantityDelta?: TimelineQuantityDelta;
  /** Which organisation held the material after this event. */
  custodyOrgId?: Id;
  tone: TimelineTone;
  href?: string;
}

/* ------------------------------------------------------------------ *
 * Actor resolution
 * ------------------------------------------------------------------ */

const ORG_TYPE_ROLE: Record<string, CirkaRole> = {
  cirka: "admin",
  manufacturer: "manufacturer",
  custodian: "custodian",
  maker: "maker",
  brand: "brand",
};

/** The role whose colour the row wears: the person's, or their organisation's. */
export function actorRoleFor(db: MockDatabase, userId?: Id, orgId?: Id): CirkaRole | undefined {
  const user = userId ? db.users.find((entry) => entry._id === userId) : undefined;

  if (user) {
    return user.role;
  }

  const org = orgId ? db.organisations.find((entry) => entry._id === orgId) : undefined;
  return org ? ORG_TYPE_ROLE[org.type] : undefined;
}

/* ------------------------------------------------------------------ *
 * Deep links & Subject resolution
 * ------------------------------------------------------------------ */

/** Detail routes that actually exist, per role. */
const DETAIL_ROUTES: Partial<Record<CirkaRole, Partial<Record<string, string>>>> = {
  admin: {
    resourceBatches: "/demo/admin/batches",
    allocations: "/demo/admin/allocations",
    productionBatches: "/demo/admin/production",
    projects: "/demo/admin/projects",
    organisations: "/demo/admin/organisations",
  },
  manufacturer: {
    resourceBatches: "/demo/manufacturer/batches",
  },
  brand: {
    projects: "/demo/brand/projects",
  },
  maker: {
    productionBatches: "/demo/maker/production",
  },
};

export function entityHref(role: CirkaRole, entityTable: string, entityId: Id): string | undefined {
  const base = DETAIL_ROUTES[role]?.[entityTable];
  return base ? `${base}/${entityId}` : undefined;
}

/**
 * Resolves a role-appropriate deep link for any entity.
 * Every role gets directed to where that entity or its parent thread is accessible in their interface.
 */
export function resolveEntityHref(
  db: MockDatabase,
  role: CirkaRole,
  entityTable: string,
  entityId: Id,
): string | undefined {
  if (role === "admin") {
    if (entityTable === "resourceBatches") return `/demo/admin/batches/${entityId}`;
    if (entityTable === "allocations") return `/demo/admin/allocations/${entityId}`;
    if (entityTable === "productionBatches") return `/demo/admin/production/${entityId}`;
    if (entityTable === "projects") return `/demo/admin/projects/${entityId}`;
    if (entityTable === "organisations") return `/demo/admin/organisations/${entityId}`;
    if (entityTable === "matches") {
      const match = db.matches.find((m) => m._id === entityId);
      if (match?.batchId) return `/demo/admin/batches/${match.batchId}`;
      const req = match ? db.resourceRequests.find((r) => r._id === match.requestId) : undefined;
      if (req?.projectId) return `/demo/admin/projects/${req.projectId}`;
    }
    if (entityTable === "productionCosts") {
      const cost = db.productionCosts.find((c) => c._id === entityId);
      if (cost?.productionBatchId) return `/demo/admin/production/${cost.productionBatchId}`;
    }
    if (entityTable === "resourceRequests") {
      const req = db.resourceRequests.find((r) => r._id === entityId);
      if (req?.projectId) return `/demo/admin/projects/${req.projectId}`;
    }
  }

  if (role === "manufacturer") {
    if (entityTable === "resourceBatches") return `/demo/manufacturer/batches/${entityId}`;
    if (entityTable === "allocations") {
      const alloc = db.allocations.find((a) => a._id === entityId);
      if (alloc?.batchId) return `/demo/manufacturer/batches/${alloc.batchId}`;
    }
    if (entityTable === "matches") {
      const match = db.matches.find((m) => m._id === entityId);
      if (match?.batchId) return `/demo/manufacturer/batches/${match.batchId}`;
    }
    if (entityTable === "projects") {
      const match = db.matches.find((m) => {
        const req = db.resourceRequests.find((r) => r._id === m.requestId);
        return req?.projectId === entityId;
      });
      if (match?.batchId) return `/demo/manufacturer/batches/${match.batchId}`;
    }
  }

  if (role === "custodian") {
    if (entityTable === "resourceBatches") return `/demo/custodian/stock?batchId=${entityId}`;
    if (entityTable === "allocations") {
      const alloc = db.allocations.find((a) => a._id === entityId);
      const user = db.users.find((u) => u.role === "custodian");
      if (alloc && user && alloc.fromOrgId === user.orgId) {
        return `/demo/custodian/dispatches?id=${entityId}`;
      }
      return `/demo/custodian/arrivals?id=${entityId}`;
    }
    if (entityTable === "matches") {
      const match = db.matches.find((m) => m._id === entityId);
      if (match?.batchId) return `/demo/custodian/stock?batchId=${match.batchId}`;
    }
    if (entityTable === "projects") {
      const alloc = db.allocations.find((a) => a.projectId === entityId);
      if (alloc) return `/demo/custodian/arrivals?id=${alloc._id}`;
    }
  }

  if (role === "maker") {
    if (entityTable === "productionBatches") return `/demo/maker/production/${entityId}`;
    if (entityTable === "resourceBatches") {
      const batch = db.resourceBatches.find((b) => b._id === entityId);
      if (batch && isListedLot(batch)) return `/demo/maker/marketplace/${entityId}`;
      const alloc = db.allocations.find((a) => a.batchId === entityId);
      if (alloc) return `/demo/maker/allocations?id=${alloc._id}`;
      const prod = db.productionBatches.find((p) => p.batchId === entityId);
      if (prod) return `/demo/maker/production/${prod._id}`;
    }
    if (entityTable === "allocations") return `/demo/maker/allocations?id=${entityId}`;
    if (entityTable === "matches") {
      const match = db.matches.find((m) => m._id === entityId);
      if (match?.batchId) {
        const batch = db.resourceBatches.find((b) => b._id === match.batchId);
        if (batch && isListedLot(batch)) return `/demo/maker/marketplace/${batch._id}`;
      }
    }
    if (entityTable === "projects") return `/demo/maker/projects/${entityId}`;
    if (entityTable === "resourceRequests") return `/demo/maker/requests/${entityId}`;
  }

  if (role === "brand") {
    if (entityTable === "projects") return `/demo/brand/projects/${entityId}`;
    if (entityTable === "resourceBatches") {
      const batch = db.resourceBatches.find((b) => b._id === entityId);
      if (batch && isListedLot(batch)) return `/demo/brand/marketplace/${entityId}`;
      const alloc = db.allocations.find((a) => a.batchId === entityId && a.projectId);
      if (alloc?.projectId) return `/demo/brand/projects/${alloc.projectId}`;
      const match = db.matches.find((m) => m.batchId === entityId);
      if (match) {
        const req = db.resourceRequests.find((r) => r._id === match.requestId);
        if (req?.projectId) return `/demo/brand/projects/${req.projectId}`;
      }
    }
    if (entityTable === "productionBatches") {
      const prod = db.productionBatches.find((p) => p._id === entityId);
      if (prod?.projectId) return `/demo/brand/projects/${prod.projectId}`;
    }
    if (entityTable === "allocations") {
      const alloc = db.allocations.find((a) => a._id === entityId);
      if (alloc?.projectId) return `/demo/brand/projects/${alloc.projectId}`;
      if (alloc?.batchId) {
        const batch = db.resourceBatches.find((b) => b._id === alloc.batchId);
        if (batch && isListedLot(batch)) return `/demo/brand/marketplace/${batch._id}`;
      }
    }
    if (entityTable === "matches") {
      const match = db.matches.find((m) => m._id === entityId);
      if (match) {
        const req = db.resourceRequests.find((r) => r._id === match.requestId);
        if (req?.projectId) return `/demo/brand/projects/${req.projectId}`;
        if (match.batchId) {
          const batch = db.resourceBatches.find((b) => b._id === match.batchId);
          if (batch && isListedLot(batch)) return `/demo/brand/marketplace/${batch._id}`;
        }
      }
    }
    if (entityTable === "resourceRequests") {
      const req = db.resourceRequests.find((r) => r._id === entityId);
      if (req?.projectId) return `/demo/brand/projects/${req.projectId}`;
    }
  }

  return undefined;
}

/**
 * Resolves the display name of the subject batch, product, or project for any entity.
 */
export function resolveSubject(
  db: MockDatabase,
  entityTable: string,
  entityId: Id,
): string | undefined {
  if (entityTable === "resourceBatches") {
    return db.resourceBatches.find((b) => b._id === entityId)?.name;
  }
  if (entityTable === "productionBatches") {
    return db.productionBatches.find((p) => p._id === entityId)?.productName;
  }
  if (entityTable === "allocations") {
    const alloc = db.allocations.find((a) => a._id === entityId);
    if (alloc?.batchId) return db.resourceBatches.find((b) => b._id === alloc.batchId)?.name;
    return alloc?.reference;
  }
  if (entityTable === "matches") {
    const match = db.matches.find((m) => m._id === entityId);
    if (match?.batchId) return db.resourceBatches.find((b) => b._id === match.batchId)?.name;
    if (match?.requestId) return db.resourceRequests.find((r) => r._id === match.requestId)?.title;
  }
  if (entityTable === "productionCosts") {
    const cost = db.productionCosts.find((c) => c._id === entityId);
    if (cost?.productionBatchId) {
      return db.productionBatches.find((p) => p._id === cost.productionBatchId)?.productName;
    }
  }
  if (entityTable === "projects") {
    return db.projects.find((p) => p._id === entityId)?.title;
  }
  if (entityTable === "resourceRequests") {
    return db.resourceRequests.find((r) => r._id === entityId)?.title;
  }
  if (entityTable === "organisations") {
    return db.organisations.find((o) => o._id === entityId)?.name;
  }
  if (entityTable === "users") {
    return db.users.find((u) => u._id === entityId)?.name;
  }
  return undefined;
}

function batchHref(db: MockDatabase, role: CirkaRole, batchId: Id): string | undefined {
  return resolveEntityHref(db, role, "resourceBatches", batchId);
}

/* ------------------------------------------------------------------ *
 * Projections
 * ------------------------------------------------------------------ */

/**
 * `quantity_moved` audit entries are dropped: the ledger movement carries the
 * same fact with the numbers attached, and two rows for one pour reads as a bug.
 */
export function auditToEvent(
  db: MockDatabase,
  entry: AuditEntry,
  role: CirkaRole,
): TimelineEvent | undefined {
  if (entry.action === "quantity_moved") {
    return undefined;
  }

  const described = describeAudit(db, entry);

  if (!described) {
    return undefined;
  }

  return {
    id: entry._id,
    occurredAt: entry.occurredAt,
    source: "audit",
    entityTable: entry.entityTable,
    entityId: entry.entityId,
    actorUserId: entry.actorUserId,
    actorOrgId: entry.actorOrgId,
    actorRole: actorRoleFor(db, entry.actorUserId, entry.actorOrgId),
    actorType: entry.actorType,
    headline: described.headline,
    subject: resolveSubject(db, entry.entityTable, entry.entityId),
    detail: described.detail ?? entry.notes,
    tone: described.tone,
    href: resolveEntityHref(db, role, entry.entityTable, entry.entityId),
  };
}

export function movementToEvent(
  db: MockDatabase,
  movement: QuantityMovement,
  role: CirkaRole,
): TimelineEvent {
  const described = describeMovement(db, movement);

  return {
    id: movement._id,
    occurredAt: movement.occurredAt,
    source: "movement",
    entityTable: "resourceBatches",
    entityId: movement.batchId,
    actorUserId: movement.performedByUserId,
    actorOrgId: movement.performedByOrgId,
    actorRole: actorRoleFor(db, movement.performedByUserId, movement.performedByOrgId),
    actorType: movement.performedByUserId ? "user" : "system",
    headline: described.headline,
    subject: resolveSubject(db, "resourceBatches", movement.batchId) ?? db.resourceBatches.find((batch) => batch._id === movement.batchId)?.name,
    detail: described.detail ?? movement.notes,
    quantityDelta: {
      quantity: movement.quantity,
      unit: movement.unit,
      from: movement.fromBucket,
      to: movement.toBucket,
    },
    custodyOrgId: described.custodyOrgId,
    tone: described.tone,
    href: resolveEntityHref(db, role, "resourceBatches", movement.batchId),
  };
}

/** Only completed milestones become events: a plan is not a thing that happened. */
export function milestoneToEvent(
  db: MockDatabase,
  milestone: ProjectMilestone,
  role: CirkaRole,
): TimelineEvent | undefined {
  if (milestone.status !== "completed" || !milestone.actualDate) {
    return undefined;
  }

  const described = describeMilestone(db, milestone);

  return {
    id: milestone._id,
    occurredAt: milestone.actualDate,
    source: "milestone",
    entityTable: "projects",
    entityId: milestone.projectId,
    actorType: "system",
    headline: described.headline,
    subject: resolveSubject(db, "projects", milestone.projectId),
    detail: described.detail,
    tone: described.tone,
    href: resolveEntityHref(db, role, "projects", milestone.projectId),
  };
}

/** Newest first, with a stable tiebreak so two events on one timestamp never swap. */
export function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(
    (left, right) => right.occurredAt - left.occurredAt || left.id.localeCompare(right.id),
  );
}

/** Day buckets for rendering, newest day first, events within a day newest first. */
export interface TimelineDay {
  key: string;
  date: Timestamp;
  events: TimelineEvent[];
}

export function groupByDay(events: TimelineEvent[]): TimelineDay[] {
  const days = new Map<string, TimelineEvent[]>();

  for (const event of sortEvents(events)) {
    const date = new Date(event.occurredAt);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    days.set(key, [...(days.get(key) ?? []), event]);
  }

  return [...days.entries()].map(([key, dayEvents]) => ({
    key,
    date: dayEvents[0].occurredAt,
    events: dayEvents,
  }));
}
