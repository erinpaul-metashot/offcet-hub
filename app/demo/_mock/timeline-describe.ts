/**
 * Narration: turns a raw record change into a sentence a person can read.
 *
 * `"status_changed · allocations"` is a database fact, not a timeline entry.
 * This module is the only place that phrasing lives, and every word it uses
 * comes from `domain.ts` — no product vocabulary is invented here.
 *
 * It sits in `_mock/` rather than `_components/` because it needs the same
 * organisation and person lookups the selectors use, and because the real
 * backend will want these strings for notification copy.
 */

import {
  ARRIVAL_ISSUE_LABELS,
  BUCKET_LABELS,
  MILESTONE_LABELS,
  MOVEMENT_REASON_LABELS,
  STATUS_LABELS,
  type ArrivalIssue,
} from "./domain";
import { movementLabel } from "./ledger";
import { formatQuantity, orgName, userName } from "./selectors-shared";
import type { TimelineTone } from "./timeline";
import type {
  AuditEntry,
  FieldChange,
  Id,
  MockDatabase,
  ProjectMilestone,
  QuantityMovement,
} from "./types";

export interface Described {
  headline: string;
  detail?: string;
  tone: TimelineTone;
  custodyOrgId?: Id;
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function statusLabel(value?: string): string | undefined {
  return value ? (STATUS_LABELS[value] ?? value.replace(/_/g, " ")) : undefined;
}

function changed(changes: FieldChange[] | undefined, field: string): FieldChange | undefined {
  return changes?.find((change) => change.field === field);
}

/** The actor's organisation, or "CIRKA" when a background process did it. */
function actor(db: MockDatabase, entry: AuditEntry): string {
  if (entry.actorOrgId) {
    return orgName(db, entry.actorOrgId);
  }

  return entry.actorUserId ? userName(db, entry.actorUserId) : "CIRKA";
}

/** Field changes rendered as "status: proposed → accepted", for the detail line. */
function changeSummary(changes?: FieldChange[]): string | undefined {
  if (!changes || changes.length === 0) {
    return undefined;
  }

  return changes
    .slice(0, 4)
    .map((change) => {
      const from = statusLabel(change.previousValue) ?? "empty";
      const to = statusLabel(change.newValue) ?? "empty";
      return `${change.field.replace(/([A-Z])/g, " $1").toLowerCase()}: ${from} → ${to}`;
    })
    .join(" · ");
}

const ABORTED_STATUSES = new Set([
  "declined",
  "rejected",
  "cancelled",
  "withdrawn",
  "unfulfillable",
  "superseded",
  "disabled",
  "skipped",
  "failed",
]);

const WARNING_STATUSES = new Set([
  "discrepancy",
  "receipt_discrepancy",
  "on_hold",
  "damaged",
  "returned",
  "overdue",
]);

function toneForStatus(status?: string): TimelineTone {
  if (!status) return "neutral";
  if (ABORTED_STATUSES.has(status)) return "aborted";
  if (WARNING_STATUSES.has(status)) return "warning";
  if (["completed", "approved", "received", "fulfilled", "closed", "success"].includes(status)) {
    return "success";
  }
  return "progress";
}

/* ------------------------------------------------------------------ *
 * Per-table narration
 * ------------------------------------------------------------------ */

function describeBatch(db: MockDatabase, entry: AuditEntry): Described {
  const batch = db.resourceBatches.find((row) => row._id === entry.entityId);
  const name = batch ? `"${batch.name}"` : "a resource batch";
  const who = actor(db, entry);

  switch (entry.action) {
    case "created":
      return {
        headline: `${who} recorded ${name}`,
        detail: batch
          ? `${formatQuantity(batch.quantityOriginal, batch.unit)} · ${batch.reference}`
          : undefined,
        tone: "progress",
      };

    case "reviewed": {
      const assurance = changed(entry.fieldChanges, "assuranceLevel");
      return {
        headline: `CIRKA reviewed ${name}`,
        detail: assurance ? `Assurance set to ${statusLabel(assurance.newValue)}` : undefined,
        tone: "success",
      };
    }

    case "status_changed": {
      const exception = changed(entry.fieldChanges, "exceptionStatus");

      if (exception) {
        return exception.newValue
          ? {
              headline: `${statusLabel(exception.newValue)} flagged on ${name}`,
              tone: "warning",
            }
          : { headline: `Exception cleared on ${name}`, tone: "success" };
      }

      const status = changed(entry.fieldChanges, "status");

      if (status?.newValue === "awaiting_review") {
        return { headline: `${who} released ${name} for matching`, tone: "progress" };
      }

      return {
        headline: `${name} is now ${statusLabel(status?.newValue) ?? "updated"}`,
        tone: toneForStatus(status?.newValue),
      };
    }

    case "updated":
      return {
        headline: `${who} updated ${name}`,
        detail: changeSummary(entry.fieldChanges),
        tone: "neutral",
      };

    case "deleted":
      return { headline: `${name} was removed`, tone: "aborted" };

    default:
      return { headline: `${name} was ${entry.action.replace(/_/g, " ")}`, tone: "neutral" };
  }
}

function describeAllocation(db: MockDatabase, entry: AuditEntry): Described {
  const allocation = db.allocations.find((row) => row._id === entry.entityId);
  const to = allocation ? orgName(db, allocation.toOrgId) : "the receiving organisation";
  const from = allocation ? orgName(db, allocation.fromOrgId) : "the sender";
  const quantity = allocation
    ? formatQuantity(allocation.quantityAllocated, allocation.unit)
    : "material";

  switch (entry.action) {
    case "created":
      return {
        headline: `${quantity} allocated to ${to}`,
        detail: allocation ? `${allocation.reference} · from ${from}` : undefined,
        tone: "progress",
      };

    case "reviewed": {
      const resolution = changed(entry.fieldChanges, "discrepancyResolution");
      return {
        headline: `CIRKA resolved the quantity discrepancy`,
        detail: resolution ? `Closed as ${statusLabel(resolution.newValue)}` : entry.notes,
        tone: "success",
      };
    }

    case "status_changed": {
      const issue = changed(entry.fieldChanges, "arrivalIssue");

      if (issue?.newValue) {
        return {
          headline: `${to} reported an arrival problem`,
          detail: ARRIVAL_ISSUE_LABELS[issue.newValue as ArrivalIssue] ?? issue.newValue,
          tone: "warning",
        };
      }

      const status = changed(entry.fieldChanges, "status")?.newValue;

      switch (status) {
        case "accepted":
          return { headline: `${to} accepted the allocation`, tone: "progress" };
        case "declined":
          return { headline: `${to} declined the allocation`, detail: entry.notes, tone: "aborted" };
        case "awaiting_dispatch":
          return { headline: `${from} confirmed it is ready to dispatch`, tone: "progress" };
        case "in_transit":
          return {
            headline: `${from} dispatched ${allocation ? formatQuantity(allocation.quantityDispatched ?? allocation.quantityAllocated, allocation.unit) : quantity}`,
            detail: allocation?.dispatchReference
              ? `Dispatch reference ${allocation.dispatchReference}`
              : undefined,
            tone: "progress",
          };
        case "received":
          return {
            headline: `${to} confirmed receipt of ${allocation ? formatQuantity(allocation.quantityReceived ?? allocation.quantityAllocated, allocation.unit) : quantity}`,
            tone: "success",
          };
        case "discrepancy":
          return {
            headline: `${to} received less than was dispatched`,
            detail: allocation?.quantityDiscrepancy
              ? `${formatQuantity(allocation.quantityDiscrepancy, allocation.unit)} unaccounted for`
              : entry.notes,
            tone: "warning",
          };
        case "returned":
          return { headline: `${to} returned unused material`, detail: entry.notes, tone: "warning" };
        case "cancelled":
          return { headline: `The allocation to ${to} was cancelled`, detail: entry.notes, tone: "aborted" };
        default:
          return {
            headline: `Allocation to ${to} is now ${statusLabel(status) ?? "updated"}`,
            tone: toneForStatus(status),
          };
      }
    }

    default:
      return {
        headline: `Allocation to ${to} was ${entry.action.replace(/_/g, " ")}`,
        detail: changeSummary(entry.fieldChanges),
        tone: "neutral",
      };
  }
}

function describeMatch(db: MockDatabase, entry: AuditEntry): Described {
  const match = db.matches.find((row) => row._id === entry.entityId);
  const batch = match ? db.resourceBatches.find((row) => row._id === match.batchId) : undefined;
  const request = match
    ? db.resourceRequests.find((row) => row._id === match.requestId)
    : undefined;
  const subject = batch ? `"${batch.name}"` : "a batch";
  const against = request ? `"${request.title}"` : "the request";

  switch (entry.action) {
    case "created":
      return {
        headline: `CIRKA proposed ${subject} for ${against}`,
        detail: match
          ? `${formatQuantity(match.quantityProposed, match.unit)} · ${match.rationale}`
          : undefined,
        tone: "progress",
      };

    case "approved":
      return {
        headline: `${actor(db, entry)} approved the match`,
        detail: entry.notes ?? match?.decisionNote,
        tone: "success",
      };

    case "rejected":
      return {
        headline: `${actor(db, entry)} declined the match`,
        detail: entry.notes ?? match?.decisionNote,
        tone: "aborted",
      };

    default:
      return {
        headline: `CIRKA withdrew the match on ${subject}`,
        detail: entry.notes,
        tone: "aborted",
      };
  }
}

function describeRequest(db: MockDatabase, entry: AuditEntry): Described {
  const request = db.resourceRequests.find((row) => row._id === entry.entityId);
  const title = request ? `"${request.title}"` : "a resource request";
  const who = actor(db, entry);

  switch (entry.action) {
    case "created":
      return {
        headline: `${who} drafted ${title}`,
        detail: request ? formatQuantity(request.quantityNeeded, request.unit) : undefined,
        tone: "neutral",
      };

    case "submitted":
      return {
        headline: `${who} submitted ${title} to CIRKA`,
        detail: request ? `${formatQuantity(request.quantityNeeded, request.unit)} needed` : undefined,
        tone: "progress",
      };

    case "status_changed": {
      const status = changed(entry.fieldChanges, "status")?.newValue;

      if (status === "unfulfillable") {
        return { headline: `CIRKA could not fulfil ${title}`, detail: entry.notes, tone: "aborted" };
      }

      return {
        headline: `${title} is now ${statusLabel(status) ?? "updated"}`,
        tone: toneForStatus(status),
      };
    }

    default:
      return { headline: `${title} was ${entry.action.replace(/_/g, " ")}`, tone: "neutral" };
  }
}

function describeProject(db: MockDatabase, entry: AuditEntry): Described {
  const project = db.projects.find((row) => row._id === entry.entityId);
  const title = project ? `"${project.title}"` : "a project";

  switch (entry.action) {
    case "created":
      return {
        headline: `${actor(db, entry)} created ${title}`,
        detail: project?.objective,
        tone: "progress",
      };

    case "status_changed": {
      const status = changed(entry.fieldChanges, "status")?.newValue;
      return {
        headline: status === "active" ? `${title} went live` : `${title} is now ${statusLabel(status)}`,
        tone: toneForStatus(status),
      };
    }

    default:
      return { headline: `${title} was ${entry.action.replace(/_/g, " ")}`, tone: "neutral" };
  }
}

function describeProduction(db: MockDatabase, entry: AuditEntry): Described {
  const production = db.productionBatches.find((row) => row._id === entry.entityId);
  const name = production ? `"${production.productName}"` : "a production batch";
  const maker = production ? orgName(db, production.makerOrgId) : actor(db, entry);

  switch (entry.action) {
    case "created":
      return {
        headline: `${maker} opened production of ${name}`,
        detail: production
          ? `${production.plannedQuantity} planned · ${production.reference}`
          : undefined,
        tone: "progress",
      };

    case "submitted":
      return {
        headline: `${maker} submitted evidence for ${name}`,
        detail: entry.notes ?? production?.makerNotes,
        tone: "progress",
      };

    case "reviewed": {
      const status = changed(entry.fieldChanges, "evidenceStatus")?.newValue;
      const approved = status === "cirka_reviewed";
      return {
        headline: approved
          ? `CIRKA approved the evidence for ${name}`
          : `CIRKA sent the evidence for ${name} back`,
        detail: entry.notes ?? production?.reviewNotes,
        tone: approved ? "success" : "warning",
      };
    }

    case "status_changed": {
      const status = changed(entry.fieldChanges, "status")?.newValue;

      if (status === "in_production") {
        return { headline: `${maker} started making ${name}`, tone: "progress" };
      }

      if (status === "completed") {
        return {
          headline: `${maker} completed ${name}`,
          detail: production?.actualQuantity
            ? `${production.actualQuantity} made`
            : undefined,
          tone: "success",
        };
      }

      return {
        headline: `${name} is now ${statusLabel(status) ?? "updated"}`,
        tone: toneForStatus(status),
      };
    }

    case "updated":
      return {
        headline: `${maker} updated ${name}`,
        detail: changeSummary(entry.fieldChanges),
        tone: "neutral",
      };

    default:
      return { headline: `${name} was ${entry.action.replace(/_/g, " ")}`, tone: "neutral" };
  }
}

function describeOrganisation(db: MockDatabase, entry: AuditEntry): Described {
  const org = db.organisations.find((row) => row._id === entry.entityId);
  const name = org?.name ?? "an organisation";

  switch (entry.action) {
    case "created":
      return { headline: `${name} joined CIRKA`, detail: org?.description, tone: "progress" };

    case "updated": {
      const status = changed(entry.fieldChanges, "status");

      if (status) {
        const approved = status.newValue === "approved";
        return {
          headline: approved ? `CIRKA approved ${name}` : `${name} is now ${statusLabel(status.newValue)}`,
          detail: entry.notes,
          tone: approved ? "success" : toneForStatus(status.newValue),
        };
      }

      return {
        headline: `${name} was updated`,
        detail: changeSummary(entry.fieldChanges),
        tone: "neutral",
      };
    }

    case "deleted":
      return { headline: `${name} was removed`, tone: "aborted" };

    default:
      return { headline: `${name} was ${entry.action.replace(/_/g, " ")}`, tone: "neutral" };
  }
}

function describeUser(db: MockDatabase, entry: AuditEntry): Described {
  const user = db.users.find((row) => row._id === entry.entityId);
  const name = user?.name ?? "a person";
  const status = changed(entry.fieldChanges, "status")?.newValue;

  switch (entry.action) {
    case "created":
      return {
        headline: `${name} was added to ${user ? orgName(db, user.orgId) : "an organisation"}`,
        tone: "progress",
      };

    case "status_changed":
      return {
        headline:
          status === "approved" ? `CIRKA approved ${name}'s account` : `${name}'s account is now ${statusLabel(status)}`,
        detail: entry.notes,
        tone: status === "approved" ? "success" : toneForStatus(status),
      };

    case "deleted":
      return { headline: `${name}'s account was removed`, detail: entry.notes, tone: "aborted" };

    default:
      return {
        headline: `${name}'s account was ${entry.action.replace(/_/g, " ")}`,
        detail: changeSummary(entry.fieldChanges),
        tone: "neutral",
      };
  }
}

function describeArrival(db: MockDatabase, entry: AuditEntry): Described {
  const arrival = db.pendingArrivals.find((row) => row._id === entry.entityId);
  const label = arrival?.name ? `"${arrival.name}"` : "an inbound record";
  const status = changed(entry.fieldChanges, "status")?.newValue;

  if (entry.action === "created") {
    return {
      headline: `${label} arrived from ${arrival?.externalSystemName ?? "a connected system"}`,
      detail: entry.notes,
      tone: "neutral",
    };
  }

  if (status === "confirmed") {
    return { headline: `${label} was confirmed into the ledger`, detail: entry.notes, tone: "success" };
  }

  return { headline: `${label} was skipped`, detail: entry.notes, tone: "aborted" };
}

function describeGeneric(db: MockDatabase, entry: AuditEntry): Described {
  const subject = entry.entityTable
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/s$/, "");

  return {
    headline: `${actor(db, entry)} ${entry.action.replace(/_/g, " ")} a ${subject.trim()}`,
    detail: entry.notes ?? changeSummary(entry.fieldChanges),
    tone: entry.action === "deleted" ? "aborted" : "neutral",
  };
}

const DESCRIBERS: Record<string, (db: MockDatabase, entry: AuditEntry) => Described> = {
  resourceBatches: describeBatch,
  allocations: describeAllocation,
  matches: describeMatch,
  resourceRequests: describeRequest,
  projects: describeProject,
  productionBatches: describeProduction,
  organisations: describeOrganisation,
  users: describeUser,
  pendingArrivals: describeArrival,
};

export function describeAudit(db: MockDatabase, entry: AuditEntry): Described | undefined {
  return (DESCRIBERS[entry.entityTable] ?? describeGeneric)(db, entry);
}

/* ------------------------------------------------------------------ *
 * Ledger movements
 * ------------------------------------------------------------------ */

const MOVEMENT_TONE: Partial<Record<QuantityMovement["reason"], TimelineTone>> = {
  initial_record: "progress",
  received: "success",
  consumed: "success",
  shortfall: "warning",
  written_off: "warning",
  returned: "warning",
  reservation_released: "aborted",
  correction: "success",
};

/**
 * The allocation a pour belongs to. Movements recorded by hand carry
 * `allocationId`; seeded and imported ones do not, so fall back to the most
 * recent dispatch on the same batch at or before the pour.
 */
function allocationForMovement(db: MockDatabase, movement: QuantityMovement) {
  if (movement.allocationId) {
    return db.allocations.find((row) => row._id === movement.allocationId);
  }

  return db.allocations
    .filter(
      (row) =>
        row.batchId === movement.batchId &&
        (row.dispatchedAt ?? row.createdAt) <= movement.occurredAt,
    )
    .sort((left, right) => (right.dispatchedAt ?? right.createdAt) - (left.dispatchedAt ?? left.createdAt))[0];
}

/**
 * Where the material physically sat once this pour finished. Terminal buckets
 * return nothing: consuming or writing off material does not hand it to anyone,
 * and emitting the owner there would break the custody chain back to the start.
 */
function custodyAfter(db: MockDatabase, movement: QuantityMovement): Id | undefined {
  const batch = db.resourceBatches.find((row) => row._id === movement.batchId);
  const allocation = allocationForMovement(db, movement);

  switch (movement.toBucket) {
    case "at_custodian":
    case "with_maker":
      return allocation?.toOrgId ?? batch?.ownerOrgId;
    case "in_transit":
      return allocation?.fromOrgId ?? batch?.ownerOrgId;
    /* Only the opening pour names the owner. Later returns to `available` are
       an accounting move, not a hand-back, and re-emitting the owner there
       would loop the custody chain. */
    case "available":
      return movement.reason === "initial_record" ? batch?.ownerOrgId : undefined;
    default:
      return undefined;
  }
}

export function describeMovement(db: MockDatabase, movement: QuantityMovement): Described {
  const label = movementLabel(movement);
  const amount = formatQuantity(movement.quantity, movement.unit);
  const who = movement.performedByOrgId ? orgName(db, movement.performedByOrgId) : "CIRKA";

  const route =
    movement.fromBucket && movement.toBucket
      ? `${BUCKET_LABELS[movement.fromBucket]} → ${BUCKET_LABELS[movement.toBucket]}`
      : movement.toBucket
        ? `Into ${BUCKET_LABELS[movement.toBucket]}`
        : undefined;

  return {
    headline:
      movement.reason === "initial_record"
        ? `${who} opened the ledger at ${amount}`
        : `${amount} · ${label}`,
    detail: [route, MOVEMENT_REASON_LABELS[movement.reason]].filter(Boolean).join(" · "),
    tone: MOVEMENT_TONE[movement.reason] ?? "progress",
    custodyOrgId: custodyAfter(db, movement),
  };
}

/* ------------------------------------------------------------------ *
 * Milestones
 * ------------------------------------------------------------------ */

export function describeMilestone(db: MockDatabase, milestone: ProjectMilestone): Described {
  const responsible = milestone.responsibleOrgId
    ? orgName(db, milestone.responsibleOrgId)
    : undefined;

  return {
    headline: `Milestone reached: ${milestone.name || MILESTONE_LABELS[milestone.stage]}`,
    detail: [responsible, milestone.notes].filter(Boolean).join(" · ") || undefined,
    tone: "success",
  };
}
