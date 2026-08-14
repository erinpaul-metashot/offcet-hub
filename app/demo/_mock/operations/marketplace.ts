/**
 * Enquiries raised against a listed lot.
 *
 * A listing is a shop window, not a shelf you can take from. Enquiring creates
 * an ordinary `ResourceRequest` that names the lot it came from — nothing is
 * reserved, nothing is promised, and two organisations may enquire on the same
 * lot. Quantity only moves when a CIRKA administrator proposes a match
 * (`demand.proposeMatch`) and the match is approved. That is the whole
 * guarantee behind "everything goes through CIRKA": this file cannot move a
 * single kilo.
 */

import type { Id, MockDatabase, ResourceBatch } from "../types";
import type { ViewerScope } from "../visibility";
import * as demand from "./demand";
import { OperationError, requirePositive, requireRow, requireText } from "./helpers";

/** Why a batch is not on the marketplace, or `undefined` when it is. */
export function listingBlocker(batch: ResourceBatch): string | undefined {
  if (batch.deletedAt) {
    return "This lot has been withdrawn.";
  }

  if (!batch.releasedAt) {
    return "The manufacturer has not released this lot for matching yet.";
  }

  if (!batch.reviewedAt) {
    return "CIRKA has not reviewed this lot yet.";
  }

  if (batch.exceptionStatus) {
    return "This lot is on hold while CIRKA resolves an exception.";
  }

  if (batch.pots.available <= 0) {
    return "Every kilo of this lot is already committed.";
  }

  return undefined;
}

/** CIRKA-reviewed, manufacturer-released, unencumbered, and still has uncommitted quantity. */
export function isListedLot(batch: ResourceBatch): boolean {
  return listingBlocker(batch) === undefined;
}

export interface RequestListedLotInput {
  batchId: Id;
  quantity: number;
  /** What the requester intends to make. This is what CIRKA arbitrates on. */
  intendedUse: string;
  projectId?: Id;
  neededBy?: number;
  note?: string;
}

export function requestListedLot(
  db: MockDatabase,
  actor: ViewerScope,
  input: RequestListedLotInput,
): { db: MockDatabase; requestId: Id } {
  if (actor.role !== "maker" && actor.role !== "brand") {
    throw new OperationError("Only makers and brands can enquire about a listed lot.");
  }

  const batch = requireRow(db, "resourceBatches", input.batchId, "Lot");

  if (batch.ownerOrgId === actor.orgId) {
    throw new OperationError("This lot is your own listing.");
  }

  const blocker = listingBlocker(batch);

  if (blocker) {
    throw new OperationError(blocker);
  }

  const intendedUse = requireText(
    input.intendedUse,
    "Say what you intend to make with this material — CIRKA decides on that.",
  );
  const quantity = requirePositive(input.quantity, "Quantity must be greater than zero.");

  if (quantity > batch.pots.available) {
    throw new OperationError(
      `Only ${batch.pots.available} ${batch.unit} of ${batch.reference} is uncommitted.`,
    );
  }

  const duplicate = db.resourceRequests.some(
    (request) =>
      request.sourceBatchId === batch._id &&
      request.requesterOrgId === actor.orgId &&
      !request.deletedAt &&
      !["fulfilled", "closed", "cancelled", "unfulfillable"].includes(request.status),
  );

  if (duplicate) {
    throw new OperationError(
      `You already have an open enquiry on ${batch.reference}. CIRKA will come back to you on it.`,
    );
  }

  /* An ordinary submitted request: it lands on the admin action queue as
     "awaiting match" like every other piece of demand. No pot is touched. */
  return demand.createResourceRequest(db, actor, {
    projectId: input.projectId,
    sourceBatchId: batch._id,
    title: `Enquiry: ${batch.name}`,
    materialCategory: batch.materialCategory,
    materialDescription: input.note,
    compositionRequirements: batch.composition,
    formatPreference: batch.format,
    quantityNeeded: quantity,
    unit: batch.unit,
    intendedProduct: intendedUse,
    neededBy: input.neededBy,
    submitImmediately: true,
  });
}
