/**
 * The allocation journey. One shape covers both hops — manufacturer to
 * custodian and custodian to maker — so there is one set of rules and one
 * audit format (05_SYSTEM_DESIGN §3).
 */

import { appendAudit } from "../audit";
import type { DiscrepancyResolution } from "../domain";
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

function isFirstHop(allocation: Allocation): boolean {
  return allocation.hop === "manufacturer_to_custodian";
}

/** Accept or decline a proposed allocation. */
export function respondToAllocation(
  db: MockDatabase,
  actor: ViewerScope,
  args: { allocationId: Id; accept: boolean; note?: string },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");
  const next = args.accept ? "accepted" : "declined";
  assertAllocationTransition(allocation.status, next);

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
      notes: args.accept ? "Allocation accepted." : "Allocation declined — reservation released.",
    });
  }

  const updated = patchRow(moved, "allocations", args.allocationId, {
    status: next,
    respondedByUserId: actor.userId,
    respondedAt: Date.now(),
    responseNote: args.note?.trim() || undefined,
    updatedAt: Date.now(),
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
    dispatchReadyAt: Date.now(),
    expectedDispatchDate: args.expectedDispatchDate ?? allocation.expectedDispatchDate,
    updatedAt: Date.now(),
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
      `Cannot dispatch ${quantity} ${allocation.unit} — only ${allocation.quantityAllocated} ${allocation.unit} is allocated.`,
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
    dispatchedAt: Date.now(),
    dispatchReference: args.dispatchReference?.trim() || undefined,
    expectedArrivalDate: args.expectedArrivalDate ?? allocation.expectedArrivalDate,
    updatedAt: Date.now(),
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
      openedAt: Date.now(),
      title: `${shortfall} ${allocation.unit} short on ${allocation.reference}`,
    });
  }

  const updated = patchRow(moved, "allocations", args.allocationId, {
    status: nextStatus,
    quantityReceived: received,
    quantityDiscrepancy: shortfall > 0 ? shortfall : undefined,
    discrepancyReason: shortfall > 0 ? (args.note?.trim() || "Short against the dispatch note.") : undefined,
    receivedAt: Date.now(),
    updatedAt: Date.now(),
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
        ? `Received ${received} ${allocation.unit} against ${dispatched} dispatched — ${shortfall} unexplained.`
        : `Received ${received} ${allocation.unit}, matching the dispatch note.`,
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
    discrepancyResolvedAt: Date.now(),
    discrepancyResolvedByUserId: actor.userId,
    discrepancyReason: note,
    updatedAt: Date.now(),
  });

  const withClosedAction: MockDatabase = {
    ...updated,
    actionItems: updated.actionItems.map((item) =>
      item.entityId === allocation._id && item.kind === "quantity_discrepancy" && item.status === "open"
        ? {
            ...item,
            status: "resolved" as const,
            resolvedAt: Date.now(),
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

/** Custodian offers part of its holding to a maker. */
export function proposeAllocationToMaker(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    batchId: Id;
    toOrgId: Id;
    quantity: number;
    notes?: string;
    expectedArrivalDate?: number;
    requestId?: Id;
    projectId?: Id;
  },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

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
      `Only ${uncommitted} ${batch.unit} of this batch is uncommitted at your site — ${alreadyPromised} ${batch.unit} is already promised to makers.`,
    );
  }

  const allocationId = makeId("allocation");
  const makerFacility = db.facilities.find(
    (facility) => facility.orgId === args.toOrgId && facility.type === "production",
  );
  const custodianFacility = db.facilities.find(
    (facility) => facility.orgId === actor.orgId && facility.type === "storage",
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
    fromOrgId: actor.orgId,
    fromFacilityId: custodianFacility?._id,
    toOrgId: args.toOrgId,
    toFacilityId: makerFacility?._id,
    quantityAllocated: quantity,
    unit: batch.unit,
    status: "proposed",
    expectedArrivalDate: args.expectedArrivalDate,
    proposedByUserId: actor.userId,
    notes: args.notes?.trim() || undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
    notes: `${quantity} ${allocation.unit} returned to available stock — ${note}`,
  });
}
