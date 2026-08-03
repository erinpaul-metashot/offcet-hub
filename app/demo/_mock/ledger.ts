/**
 * The quantity ledger — 04_ARCHITECTURE §6.2 and 06_DATA_MODEL §3.
 *
 * Quantity is a set of pots. Material is poured from one pot to another; it is
 * never created or destroyed except by an explicit correction, and every pour
 * is written down. `applyMovement` is the only way any pot ever changes.
 */

import { QUANTITY_BUCKETS, type MovementReason, type QuantityBucket } from "./domain";
import { makeId } from "./ids";
import type {
  Id,
  MockDatabase,
  QuantityMovement,
  QuantityPots,
  ResourceBatch,
  Timestamp,
} from "./types";

/** Quantities are stored to three decimals — enough for kg and tonnes alike. */
export function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function emptyPots(): QuantityPots {
  return {
    available: 0,
    reserved: 0,
    allocated: 0,
    in_transit: 0,
    at_custodian: 0,
    with_maker: 0,
    consumed: 0,
    written_off: 0,
    unexplained: 0,
  };
}

export function openingPots(quantity: number): QuantityPots {
  return { ...emptyPots(), available: round(quantity) };
}

export function potsTotal(pots: QuantityPots): number {
  return round(QUANTITY_BUCKETS.reduce((total, bucket) => total + pots[bucket], 0));
}

/** Quantity still moving through the system — everything except the terminal pots. */
export function activeQuantity(pots: QuantityPots): number {
  return round(
    pots.available +
      pots.reserved +
      pots.allocated +
      pots.in_transit +
      pots.at_custodian +
      pots.with_maker +
      pots.unexplained,
  );
}

/* ------------------------------------------------------------------ *
 * Legal moves — anything not on this list is not a legal move
 * ------------------------------------------------------------------ */

interface LegalMove {
  from: QuantityBucket | null;
  to: QuantityBucket | null;
  reason: MovementReason;
  label: string;
}

export const LEGAL_MOVES: readonly LegalMove[] = [
  { from: null, to: "available", reason: "initial_record", label: "Batch created" },
  { from: "available", to: "reserved", reason: "reserved", label: "Match proposed" },
  { from: "reserved", to: "available", reason: "reservation_released", label: "Match withdrawn" },
  { from: "reserved", to: "allocated", reason: "allocated", label: "Allocation accepted" },
  { from: "allocated", to: "in_transit", reason: "dispatched", label: "Dispatched" },
  { from: "at_custodian", to: "in_transit", reason: "dispatched", label: "Dispatched to maker" },
  { from: "in_transit", to: "at_custodian", reason: "received", label: "Receipt confirmed" },
  { from: "in_transit", to: "with_maker", reason: "received", label: "Receipt confirmed by maker" },
  { from: "in_transit", to: "unexplained", reason: "shortfall", label: "Receipt shortfall" },
  { from: "unexplained", to: "written_off", reason: "written_off", label: "Discrepancy closed as loss" },
  { from: "unexplained", to: "available", reason: "correction", label: "Discrepancy closed as miscount" },
  { from: "at_custodian", to: "with_maker", reason: "sub_allocated", label: "Sub-allocated to a maker" },
  { from: "with_maker", to: "consumed", reason: "consumed", label: "Used in production" },
  { from: "with_maker", to: "available", reason: "offcut_returned", label: "Offcut kept for reuse" },
  { from: "with_maker", to: "available", reason: "returned", label: "Sent back unused" },
  { from: "at_custodian", to: "available", reason: "returned", label: "Sent back unused" },
  { from: "with_maker", to: "written_off", reason: "written_off", label: "Production loss" },
  { from: "at_custodian", to: "written_off", reason: "written_off", label: "Damaged in storage" },
  { from: "available", to: "written_off", reason: "written_off", label: "Written off before allocation" },
];

function findLegalMove(
  from: QuantityBucket | null,
  to: QuantityBucket | null,
  reason: MovementReason,
): LegalMove | undefined {
  return LEGAL_MOVES.find(
    (move) => move.from === from && move.to === to && move.reason === reason,
  );
}

/* ------------------------------------------------------------------ *
 * The invariant
 * ------------------------------------------------------------------ */

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

/**
 * At any moment the sum of all pots equals the original recorded quantity.
 * If a proposed change would break this, the write is refused.
 */
export function assertInvariant(batch: Pick<ResourceBatch, "reference" | "quantityOriginal" | "pots">) {
  const total = potsTotal(batch.pots);

  if (Math.abs(total - round(batch.quantityOriginal)) > 0.001) {
    throw new LedgerError(
      `Ledger invariant broken on ${batch.reference}: pots total ${total}, original ${batch.quantityOriginal}.`,
    );
  }
}

export interface IntegrityIssue {
  batchId: Id;
  reference: string;
  message: string;
}

/** Runs the invariant across the whole database — surfaced on the demo home page. */
export function checkLedgerIntegrity(db: MockDatabase): IntegrityIssue[] {
  return db.resourceBatches.flatMap((batch) => {
    const total = potsTotal(batch.pots);
    const issues: IntegrityIssue[] = [];

    if (Math.abs(total - round(batch.quantityOriginal)) > 0.001) {
      issues.push({
        batchId: batch._id,
        reference: batch.reference,
        message: `Pots total ${total} ${batch.unit} but the batch was recorded at ${batch.quantityOriginal} ${batch.unit}.`,
      });
    }

    const negative = QUANTITY_BUCKETS.filter((bucket) => batch.pots[bucket] < 0);

    if (negative.length > 0) {
      issues.push({
        batchId: batch._id,
        reference: batch.reference,
        message: `Negative balance in ${negative.join(", ")}.`,
      });
    }

    return issues;
  });
}

/* ------------------------------------------------------------------ *
 * Derived status — 05_SYSTEM_DESIGN §2
 * ------------------------------------------------------------------ */

export interface StatusHints {
  awaitingDispatch?: boolean;
  activeProduction?: boolean;
}

/**
 * The headline status is derived from the pots, so the badge on screen can
 * never disagree with the numbers underneath it.
 */
export function deriveBatchStatus(
  batch: Pick<ResourceBatch, "pots" | "releasedAt" | "dataSource">,
  hints: StatusHints = {},
): ResourceBatch["status"] {
  const { pots } = batch;

  if (!batch.releasedAt) {
    return batch.dataSource === "manual_entry" ? "recorded" : "imported";
  }

  if (activeQuantity(pots) === 0) {
    return "completed";
  }

  if (pots.with_maker > 0) {
    return hints.activeProduction ? "in_transformation" : "fully_allocated";
  }

  if (pots.at_custodian > 0) {
    const uncommitted =
      pots.available > 0 || pots.reserved > 0 || pots.allocated > 0 || pots.in_transit > 0;
    return uncommitted ? "partially_allocated" : "received";
  }

  if (pots.in_transit > 0) {
    return "in_transit";
  }

  if (pots.allocated > 0) {
    return hints.awaitingDispatch ? "awaiting_dispatch" : "assigned";
  }

  if (pots.reserved > 0) {
    return "reserved";
  }

  return "available";
}

function hintsFor(db: MockDatabase, batchId: Id): StatusHints {
  return {
    awaitingDispatch: db.allocations.some(
      (allocation) =>
        allocation.batchId === batchId &&
        (allocation.status === "accepted" || allocation.status === "awaiting_dispatch"),
    ),
    activeProduction: db.productionBatches.some(
      (production) =>
        production.batchId === batchId &&
        !["cancelled", "cirka_reviewed"].includes(production.status),
    ),
  };
}

/** Recomputes the derived status of one batch against the current database. */
export function refreshBatchStatus(db: MockDatabase, batchId: Id): MockDatabase {
  return {
    ...db,
    resourceBatches: db.resourceBatches.map((batch) =>
      batch._id === batchId
        ? { ...batch, status: deriveBatchStatus(batch, hintsFor(db, batchId)) }
        : batch,
    ),
  };
}

/* ------------------------------------------------------------------ *
 * The only way a pot ever changes
 * ------------------------------------------------------------------ */

export interface MovementInput {
  batchId: Id;
  fromBucket: QuantityBucket | null;
  toBucket: QuantityBucket | null;
  quantity: number;
  reason: MovementReason;
  performedByUserId?: Id;
  performedByOrgId?: Id;
  allocationId?: Id;
  productionBatchId?: Id;
  occurredAt?: Timestamp;
  /** Defaults to now — the seed passes it so historic rows read correctly. */
  recordedAt?: Timestamp;
  notes?: string;
}

export function applyMovement(db: MockDatabase, input: MovementInput): MockDatabase {
  const batch = db.resourceBatches.find((entry) => entry._id === input.batchId);

  if (!batch) {
    throw new LedgerError("Resource batch not found.");
  }

  const quantity = round(input.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new LedgerError("Quantity must be greater than zero.");
  }

  const move = findLegalMove(input.fromBucket, input.toBucket, input.reason);

  if (!move) {
    throw new LedgerError(
      `Not a legal move: ${input.fromBucket ?? "—"} → ${input.toBucket ?? "—"} (${input.reason}).`,
    );
  }

  const pots = { ...batch.pots };

  if (input.fromBucket) {
    const availableInPot = pots[input.fromBucket];

    if (quantity > round(availableInPot) + 0.001) {
      throw new LedgerError(
        `Only ${round(availableInPot)} ${batch.unit} is in ${input.fromBucket.replace(/_/g, " ")} — cannot move ${quantity} ${batch.unit}.`,
      );
    }

    pots[input.fromBucket] = round(availableInPot - quantity);
  }

  if (input.toBucket) {
    pots[input.toBucket] = round(pots[input.toBucket] + quantity);
  }

  /** The opening entry is what establishes the recorded quantity. */
  const quantityOriginal =
    input.reason === "initial_record"
      ? round(batch.quantityOriginal + quantity)
      : batch.quantityOriginal;

  const nextBatch: ResourceBatch = {
    ...batch,
    pots,
    quantityOriginal,
    updatedAt: input.occurredAt ?? Date.now(),
  };

  assertInvariant(nextBatch);

  const movement: QuantityMovement = {
    _id: makeId("movement"),
    batchId: batch._id,
    allocationId: input.allocationId,
    productionBatchId: input.productionBatchId,
    fromBucket: input.fromBucket,
    toBucket: input.toBucket,
    quantity,
    unit: batch.unit,
    reason: input.reason,
    performedByUserId: input.performedByUserId,
    performedByOrgId: input.performedByOrgId,
    occurredAt: input.occurredAt ?? Date.now(),
    recordedAt: input.recordedAt ?? input.occurredAt ?? Date.now(),
    notes: input.notes,
    balanceAfter: pots,
  };

  const next: MockDatabase = {
    ...db,
    resourceBatches: db.resourceBatches.map((entry) =>
      entry._id === batch._id ? nextBatch : entry,
    ),
    quantityMovements: [...db.quantityMovements, movement],
  };

  return refreshBatchStatus(next, batch._id);
}

/** Applies several moves as one step — e.g. a short receipt splits into two. */
export function applyMovements(db: MockDatabase, inputs: MovementInput[]): MockDatabase {
  return inputs.reduce((current, input) => applyMovement(current, input), db);
}

/** The label the UI shows for a movement row. */
export function movementLabel(movement: Pick<QuantityMovement, "fromBucket" | "toBucket" | "reason">) {
  return (
    findLegalMove(movement.fromBucket, movement.toBucket, movement.reason)?.label ??
    movement.reason.replace(/_/g, " ")
  );
}
