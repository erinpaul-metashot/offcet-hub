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
 * Deep links
 * ------------------------------------------------------------------ */

/** Detail routes that actually exist, per role. Anything else gets no link. */
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
    detail: described.detail ?? entry.notes,
    tone: described.tone,
    href: entityHref(role, entry.entityTable, entry.entityId),
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
    detail: described.detail ?? movement.notes,
    quantityDelta: {
      quantity: movement.quantity,
      unit: movement.unit,
      from: movement.fromBucket,
      to: movement.toBucket,
    },
    custodyOrgId: described.custodyOrgId,
    tone: described.tone,
    href: entityHref(role, "resourceBatches", movement.batchId),
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
    detail: described.detail,
    tone: described.tone,
    href: entityHref(role, "projects", milestone.projectId),
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
