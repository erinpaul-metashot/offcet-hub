/**
 * The allocation journey. One shape covers both hops: manufacturer to
 * custodian and custodian to maker: so there is one set of rules and one
 * audit format (05_SYSTEM_DESIGN §3).
 */

import { appendAudit } from "../audit";
import { ARRIVAL_ISSUE_LABELS, type ArrivalIssue, type DiscrepancyResolution } from "../domain";
import { makeId, makeReference } from "../ids";
import { applyMovement, round } from "../ledger";
import { assertAllocationTransition } from "../transitions";
import type { Allocation, Id, MockDatabase } from "../types";
import type { ViewerScope } from "../visibility";
import {
  OperationError,
  insertRow,
  nextSequence,
  patchRow,
  requirePositive,
  requireRow,
  requireText,
} from "./helpers";
import { now as currentTime } from "../clock";

function isFirstHop(allocation: Allocation): boolean {
  return allocation.hop === "manufacturer_to_custodian";
}

/** Sum of declared storage capacity across a custodian's active sites. `undefined` = no declared limit. */
function custodianCapacityKg(db: MockDatabase, orgId: Id): number | undefined {
  const capacities = db.facilities
    .filter(
      (facility) =>
        facility.orgId === orgId &&
        facility.isActive &&
        !facility.deletedAt &&
        facility.storageCapacityKg !== undefined,
    )
    .map((facility) => facility.storageCapacityKg as number);

  return capacities.length === 0 ? undefined : capacities.reduce((sum, kg) => sum + kg, 0);
}

/** What is physically at this custodian right now, read from the pots (§ledger). */
function custodianHeldKg(db: MockDatabase, orgId: Id): number {
  const batchIds = new Set(
    db.allocations
      .filter(
        (allocation) =>
          allocation.toOrgId === orgId &&
          allocation.hop === "manufacturer_to_custodian" &&
          ["received", "discrepancy", "completed"].includes(allocation.status),
      )
      .map((allocation) => allocation.batchId),
  );

  let total = 0;
  for (const batchId of batchIds) {
    total += db.resourceBatches.find((batch) => batch._id === batchId)?.pots.at_custodian ?? 0;
  }
  return total;
}

/** Accepted-but-not-yet-arrived allocations: reserved space that isn't on the shelf yet. */
function custodianCommittedIncomingKg(db: MockDatabase, orgId: Id, excludeAllocationId: Id): number {
  return db.allocations
    .filter(
      (allocation) =>
        allocation.toOrgId === orgId &&
        allocation.hop === "manufacturer_to_custodian" &&
        allocation._id !== excludeAllocationId &&
        ["accepted", "awaiting_dispatch", "in_transit"].includes(allocation.status),
    )
    .reduce(
      (sum, allocation) => sum + (allocation.quantityDispatched ?? allocation.quantityAllocated),
      0,
    );
}

/** Accept or decline a proposed allocation. */
export function respondToAllocation(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; accept: boolean; note?: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");

  /* Only the receiver decides. A custodian approves what CIRKA sends it; it has
     no say in the hand-over out of its own warehouse — that is the maker's. */
  if (allocation.toOrgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError(
      `Only ${db.organisations.find((org) => org._id === allocation.toOrgId)?.name ?? "the receiving organisation"} can accept or decline ${allocation.reference}.`,
    );
  }

  const next = args.accept ? "accepted" : "declined";
  assertAllocationTransition(allocation.status, next);

  if (args.accept && isFirstHop(allocation)) {
    const capacityKg = custodianCapacityKg(db, actor.orgId);
    if (capacityKg !== undefined) {
      const projected = round(
        custodianHeldKg(db, actor.orgId) +
          custodianCommittedIncomingKg(db, actor.orgId, allocation._id) +
          allocation.quantityAllocated,
      );
      if (projected > capacityKg) {
        throw new OperationError(
          `Accepting this would put ${projected} kg against a ${capacityKg} kg site limit across your active sites. Decline it, or raise a site's storage capacity first.`,
        );
      }
    }
  }

  let moved = db;

  if (isFirstHop(allocation)) {
    moved = applyMovement(db, {
      batchId: allocation.batchId,
      fromBucket: "reserved",
      toBucket: args.accept ? "allocated" : "available",
      quantity: allocation.quantityAllocated,
      reason: args.accept ? "allocated" : "reservation_released",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      allocationId: allocation._id,
      notes: args.accept ? "Allocation accepted." : "Allocation declined: reservation released.",
    });
  }

  const updated = patchRow(moved, "allocations", args.allocationId, {
    status: next,
    respondedByUserId: actor.userId,
    respondedAt: currentTime(),
    responseNote: args.note?.trim() || undefined,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: args.accept ? "approved" : "rejected",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: allocation.status, newValue: next }],
    notes: args.note,
  });
}

export function confirmDispatchReadiness(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; expectedDispatchDate?: number },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  assertAllocationTransition(allocation.status, "awaiting_dispatch");

  const updated = patchRow(db, "allocations", args.allocationId, {
    status: "awaiting_dispatch",
    dispatchReadyAt: currentTime(),
    expectedDispatchDate: args.expectedDispatchDate ?? allocation.expectedDispatchDate,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      { field: "status", previousValue: allocation.status, newValue: "awaiting_dispatch" },
    ],
    notes: "Confirmed ready for dispatch.",
  });
}

export function recordDispatch(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    allocationId: Id;
    quantityDispatched: number;
    dispatchReference?: string;
    expectedArrivalDate?: number;
  },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  assertAllocationTransition(allocation.status, "in_transit");

  const quantity = requirePositive(
    args.quantityDispatched,
    "Dispatched quantity must be greater than zero.",
  );

  if (quantity > allocation.quantityAllocated + 0.001) {
    throw new OperationError(
      `Cannot dispatch ${quantity} ${allocation.unit}: only ${allocation.quantityAllocated} ${allocation.unit} is allocated.`,
    );
  }

  const moved = applyMovement(db, {
    batchId: allocation.batchId,
    fromBucket: isFirstHop(allocation) ? "allocated" : "at_custodian",
    toBucket: "in_transit",
    quantity,
    reason: "dispatched",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    allocationId: allocation._id,
    notes: args.dispatchReference ? `Consignment ${args.dispatchReference}.` : undefined,
  });

  const updated = patchRow(moved, "allocations", args.allocationId, {
    status: "in_transit",
    quantityDispatched: quantity,
    dispatchedAt: currentTime(),
    dispatchReference: args.dispatchReference?.trim() || undefined,
    expectedArrivalDate: args.expectedArrivalDate ?? allocation.expectedArrivalDate,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: allocation.status, newValue: "in_transit" }],
    notes: `Dispatched ${quantity} ${allocation.unit}.`,
  });
}

/**
 * The discrepancy rule (05_SYSTEM_DESIGN §3): the system does not quietly pick
 * a number. The received quantity lands in the receiver's pot, the difference
 * lands in "unexplained", and an admin has to close it.
 */
export function confirmReceipt(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; quantityReceived: number; note?: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const received = requirePositive(
    args.quantityReceived,
    "Received quantity must be greater than zero.",
  );

  if (received > dispatched + 0.001) {
    throw new OperationError(
      `More was received (${received} ${allocation.unit}) than dispatched (${dispatched} ${allocation.unit}). Check the weights before confirming.`,
    );
  }

  const shortfall = round(dispatched - received);
  const nextStatus = shortfall > 0 ? "discrepancy" : "received";
  assertAllocationTransition(allocation.status, nextStatus);

  const destination = isFirstHop(allocation) ? "at_custodian" : "with_maker";

  let moved = applyMovement(db, {
    batchId: allocation.batchId,
    fromBucket: "in_transit",
    toBucket: destination,
    quantity: received,
    reason: "received",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    allocationId: allocation._id,
    notes: args.note,
  });

  if (shortfall > 0) {
    moved = applyMovement(moved, {
      batchId: allocation.batchId,
      fromBucket: "in_transit",
      toBucket: "unexplained",
      quantity: shortfall,
      reason: "shortfall",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      allocationId: allocation._id,
      notes: `${shortfall} ${allocation.unit} short against the dispatch note.`,
    });

    moved = patchRow(moved, "resourceBatches", allocation.batchId, {
      exceptionStatus: "receipt_discrepancy",
      exceptionNote: `${shortfall} ${allocation.unit} short on ${allocation.reference}. Awaiting resolution.`,
    });

    moved = insertRow(moved, "actionItems", {
      _id: makeId("action"),
      entityTable: "allocations",
      entityId: allocation._id,
      kind: "quantity_discrepancy",
      severity: "blocking",
      assignedToRole: "admin",
      assignedToOrgId: actor.orgId,
      status: "open",
      openedAt: currentTime(),
      title: `${shortfall} ${allocation.unit} short on ${allocation.reference}`,
    });
  }

  const updated = patchRow(moved, "allocations", args.allocationId, {
    status: nextStatus,
    quantityReceived: received,
    quantityDiscrepancy: shortfall > 0 ? shortfall : undefined,
    discrepancyReason: shortfall > 0 ? (args.note?.trim() || "Short against the dispatch note.") : undefined,
    receivedAt: currentTime(),
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: allocation.status, newValue: nextStatus }],
    notes:
      shortfall > 0
        ? `Received ${received} ${allocation.unit} against ${dispatched} dispatched: ${shortfall} unexplained.`
        : `Received ${received} ${allocation.unit}, matching the dispatch note.`,
  });
}

/** A reported issue is either blocking or worth chasing: nothing in between. */
const ARRIVAL_ISSUE_SEVERITY: Record<ArrivalIssue, "blocking" | "warning"> = {
  damaged: "blocking",
  contaminated: "blocking",
  wrong_material: "blocking",
  missing_paperwork: "warning",
  late: "warning",
};

/** Allocations that already carry an unresolved reported issue. */
export function findOpenArrivalIssue(db: MockDatabase, allocationId: Id) {
  return db.actionItems.find(
    (item) =>
      item.entityTable === "allocations" &&
      item.entityId === allocationId &&
      item.kind === "arrival_issue" &&
      item.status === "open",
  );
}

/**
 * The other half of arrival tracking: what the weighbridge cannot see. Damage,
 * contamination and wrong material are quality facts, so no quantity moves —
 * the pots stay where `confirmReceipt` left them and an admin picks the issue
 * up from the queue. Reporting one never blocks confirming receipt.
 */
export function reportArrivalIssue(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; issue: ArrivalIssue; note: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  const note = requireText(args.note, "Describe what is wrong with the consignment.");

  if (allocation.toOrgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError("Only the receiving organisation can report an issue on this arrival.");
  }

  if (!["in_transit", "received", "discrepancy"].includes(allocation.status)) {
    throw new OperationError(
      `Nothing has been dispatched against ${allocation.reference} yet, so there is nothing to inspect.`,
    );
  }

  if (findOpenArrivalIssue(db, args.allocationId)) {
    throw new OperationError(
      "An issue is already open on this arrival. CIRKA has to close it before another is raised.",
    );
  }

  const title = `${ARRIVAL_ISSUE_LABELS[args.issue]} on ${allocation.reference}`;

  const flagged = patchRow(db, "allocations", args.allocationId, {
    arrivalIssue: args.issue,
    arrivalIssueNote: note,
    arrivalIssueReportedAt: currentTime(),
    updatedAt: currentTime(),
  });

  const withItem = insertRow(flagged, "actionItems", {
    _id: makeId("action"),
    entityTable: "allocations",
    entityId: args.allocationId,
    kind: "arrival_issue",
    severity: ARRIVAL_ISSUE_SEVERITY[args.issue],
    assignedToRole: "admin",
    assignedToOrgId: actor.orgId,
    status: "open",
    openedAt: currentTime(),
    title,
  });

  return appendAudit(withItem, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      { field: "arrivalIssue", previousValue: allocation.arrivalIssue, newValue: args.issue },
    ],
    notes: `${title}: ${note}`,
  });
}

export function resolveDiscrepancy(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; resolution: DiscrepancyResolution; note: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  const note = requireText(args.note, "Record how the discrepancy was resolved.");
  const quantity = allocation.quantityDiscrepancy ?? 0;

  if (allocation.status !== "discrepancy" || quantity <= 0) {
    throw new OperationError("This allocation has no open discrepancy.");
  }

  const toBucket = args.resolution === "count_corrected" ? "available" : "written_off";

  const moved = applyMovement(db, {
    batchId: allocation.batchId,
    fromBucket: "unexplained",
    toBucket,
    quantity,
    reason: args.resolution === "count_corrected" ? "correction" : "written_off",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    allocationId: allocation._id,
    notes: note,
  });

  const clearedBatch = patchRow(moved, "resourceBatches", allocation.batchId, {
    exceptionStatus: undefined,
    exceptionNote: undefined,
  });

  const updated = patchRow(clearedBatch, "allocations", args.allocationId, {
    status: "received",
    discrepancyResolution: args.resolution,
    discrepancyResolvedAt: currentTime(),
    discrepancyResolvedByUserId: actor.userId,
    discrepancyReason: note,
    updatedAt: currentTime(),
  });

  const withClosedAction: MockDatabase = {
    ...updated,
    actionItems: updated.actionItems.map((item) =>
      item.entityId === allocation._id && item.kind === "quantity_discrepancy" && item.status === "open"
        ? {
            ...item,
            status: "resolved" as const,
            resolvedAt: currentTime(),
            resolvedByUserId: actor.userId,
            resolutionNote: note,
          }
        : item,
    ),
  };

  return appendAudit(withClosedAction, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "reviewed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      { field: "status", previousValue: "discrepancy", newValue: "received" },
      { field: "discrepancyResolution", newValue: args.resolution },
    ],
    notes: note,
  });
}

/**
 * CIRKA places a reviewed batch with a custodian. The first hop, opened without
 * a brand request behind it: the manufacturer does not pick its own warehouse
 * and the custodian does not help itself. The quantity is reserved here and
 * only becomes the custodian's commitment once they accept.
 */
export function proposeAllocationToCustodian(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    batchId: Id;
    toOrgId: Id;
    quantity: number;
    notes?: string;
    expectedArrivalDate?: number;
  },
): MockDatabase {
  if (actor.role !== "admin") {
    throw new OperationError(
      "Only CIRKA places a batch with a custodian. A manufacturer does not pick its own warehouse.",
    );
  }

  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  if (!batch.reviewedAt) {
    throw new OperationError(
      `${batch.reference} is still awaiting CIRKA review: review it and set an assurance level before placing it with a custodian.`,
    );
  }

  const custodian = requireRow(db, "organisations", args.toOrgId, "Custodian");

  if (custodian.type !== "custodian" || custodian.status !== "approved") {
    throw new OperationError(`${custodian.name} is not an approved custodian.`);
  }

  if (quantity > batch.pots.available + 0.001) {
    throw new OperationError(
      `Only ${batch.pots.available} ${batch.unit} of ${batch.reference} is still unallocated: the rest is reserved, allocated or already moving.`,
    );
  }

  const allocationId = makeId("allocation");
  const custodianFacility = db.facilities.find(
    (facility) => facility.orgId === args.toOrgId && facility.type === "storage",
  );

  const allocation: Allocation = {
    _id: allocationId,
    reference: makeReference(
      "ALC",
      nextSequence(
        db.allocations.map((entry) => entry.reference),
        "CIRKA-ALC",
      ),
    ),
    batchId: args.batchId,
    hop: "manufacturer_to_custodian",
    fromOrgId: batch.ownerOrgId,
    fromFacilityId: batch.sourceFacilityId,
    toOrgId: args.toOrgId,
    toFacilityId: custodianFacility?._id,
    quantityAllocated: quantity,
    unit: batch.unit,
    status: "proposed",
    expectedArrivalDate: args.expectedArrivalDate,
    proposedByUserId: actor.userId,
    notes: args.notes?.trim() || undefined,
    createdAt: currentTime(),
    updatedAt: currentTime(),
  };

  /* Reserving is what stops the same quantity being promised twice. The
     custodian's acceptance is what turns it into `allocated`. */
  const reserved = applyMovement(insertRow(db, "allocations", allocation), {
    batchId: args.batchId,
    fromBucket: "available",
    toBucket: "reserved",
    quantity,
    reason: "reserved",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    allocationId,
    notes: `Reserved for ${custodian.name}.`,
  });

  return appendAudit(reserved, {
    entityTable: "allocations",
    entityId: allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: args.batchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Allocation of ${quantity} ${batch.unit} proposed to ${custodian.name}.`,
  });
}

/**
 * CIRKA assigns part of a custodian's holding on to a maker. The custodian is
 * a warehouse: it accepts material in and hands it over, but it does not pick
 * the destination, so `fromOrgId` is an argument rather than the actor.
 */
export function proposeAllocationToMaker(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    batchId: Id;
    fromOrgId: Id;
    toOrgId: Id;
    quantity: number;
    notes?: string;
    expectedArrivalDate?: number;
    requestId?: Id;
    projectId?: Id;
  },
): MockDatabase {
  if (actor.role !== "admin") {
    throw new OperationError(
      "Only CIRKA assigns a custodian's stock to a maker. A custodian stores and hands over; it does not choose who receives.",
    );
  }

  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  const custodianHasIt = db.allocations.some(
    (allocation) =>
      allocation.batchId === args.batchId &&
      allocation.toOrgId === args.fromOrgId &&
      allocation.hop === "manufacturer_to_custodian" &&
      ["received", "discrepancy", "completed"].includes(allocation.status),
  );

  if (!custodianHasIt) {
    const custodianName =
      db.organisations.find((org) => org._id === args.fromOrgId)?.name ?? "That custodian";
    throw new OperationError(
      `${custodianName} has not confirmed receipt of ${batch.reference}, so nothing can be assigned out of it yet.`,
    );
  }

  const alreadyPromised = db.allocations
    .filter(
      (allocation) =>
        allocation.batchId === args.batchId &&
        allocation.hop === "custodian_to_maker" &&
        ["proposed", "accepted", "awaiting_dispatch"].includes(allocation.status),
    )
    .reduce((total, allocation) => total + allocation.quantityAllocated, 0);

  const uncommitted = round(batch.pots.at_custodian - alreadyPromised);

  if (quantity > uncommitted + 0.001) {
    throw new OperationError(
      `Only ${uncommitted} ${batch.unit} of this batch is unassigned at the custodian: ${alreadyPromised} ${batch.unit} is already assigned to makers.`,
    );
  }

  const allocationId = makeId("allocation");
  const makerFacility = db.facilities.find(
    (facility) => facility.orgId === args.toOrgId && facility.type === "production",
  );
  const custodianFacility = db.facilities.find(
    (facility) => facility.orgId === args.fromOrgId && facility.type === "storage",
  );

  const allocation: Allocation = {
    _id: allocationId,
    reference: makeReference(
      "ALC",
      nextSequence(
        db.allocations.map((entry) => entry.reference),
        "CIRKA-ALC",
      ),
    ),
    batchId: args.batchId,
    requestId: args.requestId,
    projectId: args.projectId,
    hop: "custodian_to_maker",
    fromOrgId: args.fromOrgId,
    fromFacilityId: custodianFacility?._id,
    toOrgId: args.toOrgId,
    toFacilityId: makerFacility?._id,
    quantityAllocated: quantity,
    unit: batch.unit,
    status: "proposed",
    expectedArrivalDate: args.expectedArrivalDate,
    proposedByUserId: actor.userId,
    notes: args.notes?.trim() || undefined,
    createdAt: currentTime(),
    updatedAt: currentTime(),
  };

  return appendAudit(insertRow(db, "allocations", allocation), {
    entityTable: "allocations",
    entityId: allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: args.batchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Sub-allocation of ${quantity} ${batch.unit} proposed to a maker.`,
  });
}

/** Material sent back unused, from either a maker or a custodian. */
export function returnMaterial(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; quantity: number; note: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  const note = requireText(args.note, "Say why the material is being returned.");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  const moved = applyMovement(db, {
    batchId: allocation.batchId,
    fromBucket: isFirstHop(allocation) ? "at_custodian" : "with_maker",
    toBucket: "available",
    quantity,
    reason: "returned",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    allocationId: allocation._id,
    notes: note,
  });

  return appendAudit(moved, {
    entityTable: "allocations",
    entityId: args.allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "quantity_moved",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `${quantity} ${allocation.unit} returned to available stock: ${note}`,
  });
}
