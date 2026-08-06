/**
 * Resource batch operations.
 *
 * `createResourceBatch` is the single write path (04_ARCHITECTURE §5): the
 * manual form, the CSV importer and the simulated API push all call it and
 * differ only in the `dataSource` they stamp.
 */

import { appendAudit, diffFields } from "../audit";
import type {
  AssuranceLevel,
  BatchException,
  CompositionConfidence,
  DataSource,
  MaterialCategory,
  MaterialFormat,
  QualityClass,
  Unit,
} from "../domain";
import { makeId, makeReference } from "../ids";
import { applyMovement, deriveBatchStatus, emptyPots, refreshBatchStatus } from "../ledger";
import type { Id, MockDatabase, ResourceBatch } from "../types";
import type { ViewerScope } from "../visibility";
import { OperationError, nextSequence, patchRow, requirePositive, requireRow, requireText } from "./helpers";
import { now as currentTime } from "../clock";

export interface CreateBatchInput {
  name: string;
  description: string;
  materialCategory: MaterialCategory;
  materialSubcategory?: string;
  composition?: string;
  compositionConfidence?: CompositionConfidence;
  format?: MaterialFormat;
  qualityClass?: QualityClass;
  colour?: string;
  quantity: number;
  unit: Unit;
  availableFrom?: number;
  availableUntil?: number;
  locationText?: string;
  sourceFacilityId?: Id;
  estimatedValue?: number;
  currency?: string;
  imageUrls?: string[];
  documentNames?: string[];
  /** Stamped by the front door that called this. */
  dataSource: DataSource;
  externalSystemName?: string;
  externalRecordId?: string;
  externalRecordUrl?: string;
  importJobId?: Id;
  ownerOrgId?: Id;
  releaseImmediately?: boolean;
}

export interface CreateBatchResult {
  db: MockDatabase;
  batchId: Id;
}

/**
 * Duplicate rule (05_SYSTEM_DESIGN §7.3): a batch is identified by
 * (external system name + external record id). A second arrival with the same
 * pair updates the existing record instead of creating a new one.
 */
function findByExternalKey(db: MockDatabase, input: CreateBatchInput): ResourceBatch | undefined {
  if (!input.externalSystemName || !input.externalRecordId) {
    return undefined;
  }

  return db.resourceBatches.find(
    (batch) =>
      batch.externalSystemName === input.externalSystemName &&
      batch.externalRecordId === input.externalRecordId,
  );
}

export function createResourceBatch(
  db: MockDatabase,
  actor: ViewerScope,
  input: CreateBatchInput,
): CreateBatchResult {
  const name = requireText(input.name, "Give the resource batch a name.");
  const description = requireText(input.description, "Add a description of the material.");
  const quantity = requirePositive(input.quantity, "Quantity must be greater than zero.");
  const ownerOrgId = input.ownerOrgId ?? actor.orgId;
  const now = currentTime();

  const duplicate = findByExternalKey(db, input);

  if (duplicate) {
    const patch = {
      name,
      description,
      materialCategory: input.materialCategory,
      composition: input.composition,
      locationText: input.locationText,
      lastSyncedAt: now,
      updatedAt: now,
    };

    const updated = patchRow(db, "resourceBatches", duplicate._id, patch);

    return {
      db: appendAudit(updated, {
        entityTable: "resourceBatches",
        entityId: duplicate._id,
        action: "updated",
        actorUserId: actor.userId,
        actorOrgId: actor.orgId,
        actorType: input.dataSource === "manual_entry" ? "user" : "api",
        fieldChanges: diffFields(duplicate as unknown as Record<string, unknown>, patch),
        notes: `Duplicate of ${input.externalSystemName}/${input.externalRecordId} resolved as an update.`,
      }),
      batchId: duplicate._id,
    };
  }

  const batchId = makeId("batch");
  const reference = makeReference(
    "RB",
    nextSequence(
      db.resourceBatches.map((batch) => batch.reference),
      "CIRKA-RB",
    ),
  );

  const batch: ResourceBatch = {
    _id: batchId,
    reference,
    ownerOrgId,
    sourceFacilityId: input.sourceFacilityId,
    createdByUserId: input.dataSource === "manual_entry" ? actor.userId : undefined,
    name,
    description,
    materialCategory: input.materialCategory,
    materialSubcategory: input.materialSubcategory,
    composition: input.composition,
    compositionConfidence: input.compositionConfidence,
    format: input.format,
    qualityClass: input.qualityClass,
    colour: input.colour,
    unit: input.unit,
    quantityOriginal: 0,
    pots: emptyPots(),
    availableFrom: input.availableFrom,
    availableUntil: input.availableUntil,
    releasedAt: input.releaseImmediately ? now : undefined,
    locationText: input.locationText,
    status: "draft",
    dataSource: input.dataSource,
    assuranceLevel: "self_reported",
    externalSystemName: input.externalSystemName,
    externalRecordId: input.externalRecordId,
    externalRecordUrl: input.externalRecordUrl,
    importJobId: input.importJobId,
    importedAt: input.dataSource === "manual_entry" ? undefined : now,
    estimatedValue: input.estimatedValue,
    currency: input.currency ?? "SEK",
    imageUrls: input.imageUrls ?? [],
    documentNames: input.documentNames ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const withBatch: MockDatabase = { ...db, resourceBatches: [...db.resourceBatches, batch] };

  const withOpeningEntry = applyMovement(withBatch, {
    batchId,
    fromBucket: null,
    toBucket: "available",
    quantity,
    reason: "initial_record",
    performedByUserId: actor.userId,
    performedByOrgId: ownerOrgId,
    occurredAt: now,
    notes: input.dataSource === "manual_entry" ? undefined : "Created by import.",
  });

  return {
    db: appendAudit(withOpeningEntry, {
      entityTable: "resourceBatches",
      entityId: batchId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: ownerOrgId,
      actorType: input.dataSource === "manual_entry" ? "user" : "import",
      notes: `Recorded ${quantity} ${input.unit}: source: ${input.dataSource.replace(/_/g, " ")}.`,
    }),
    batchId,
  };
}

export type UpdateBatchPatch = Partial<
  Pick<
    ResourceBatch,
    | "name"
    | "description"
    | "materialCategory"
    | "composition"
    | "compositionConfidence"
    | "format"
    | "qualityClass"
    | "colour"
    | "availableFrom"
    | "availableUntil"
    | "locationText"
    | "sourceFacilityId"
    | "estimatedValue"
    | "imageUrls"
    | "documentNames"
  >
>;

export function updateResourceBatch(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id; patch: UpdateBatchPatch },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");
  const patch = { ...args.patch, updatedAt: currentTime() };
  const updated = patchRow(db, "resourceBatches", args.batchId, patch);

  return appendAudit(updated, {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: diffFields(batch as unknown as Record<string, unknown>, args.patch),
  });
}

/** Draft → Awaiting review: details complete, released for matching. */
export function releaseBatchForMatching(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");

  if (batch.releasedAt) {
    throw new OperationError("This batch has already been released for matching.");
  }

  const now = currentTime();
  const released = patchRow(db, "resourceBatches", args.batchId, {
    releasedAt: now,
    updatedAt: now,
  });
  const nextStatus = deriveBatchStatus({ ...batch, releasedAt: now });

  return appendAudit(refreshBatchStatus(released, args.batchId), {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: batch.status, newValue: nextStatus }],
    notes: "Released for matching.",
  });
}

export function reviewBatch(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id; assuranceLevel: AssuranceLevel; reviewNotes?: string },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");

  const reviewed = patchRow(db, "resourceBatches", args.batchId, {
    assuranceLevel: args.assuranceLevel,
    reviewedAt: currentTime(),
    reviewedByUserId: actor.userId,
    reviewNotes: args.reviewNotes?.trim() || undefined,
    updatedAt: currentTime(),
  });

  return appendAudit(refreshBatchStatus(reviewed, args.batchId), {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "reviewed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      {
        field: "assuranceLevel",
        previousValue: batch.assuranceLevel,
        newValue: args.assuranceLevel,
      },
    ],
    notes: args.reviewNotes,
  });
}

export function setBatchException(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id; exceptionStatus?: BatchException; note?: string },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");

  if (args.exceptionStatus === "on_hold" && !args.note?.trim()) {
    throw new OperationError("A hold needs a note explaining why.");
  }

  const updated = patchRow(db, "resourceBatches", args.batchId, {
    exceptionStatus: args.exceptionStatus,
    exceptionNote: args.exceptionStatus ? args.note?.trim() : undefined,
    holdReason: args.exceptionStatus === "on_hold" ? args.note?.trim() : undefined,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      {
        field: "exceptionStatus",
        previousValue: batch.exceptionStatus,
        newValue: args.exceptionStatus,
      },
    ],
    notes: args.note,
  });
}

/** Write material off before it is committed anywhere: damage in storage, contamination. */
export function writeOffAvailableQuantity(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id; quantity: number; reason: string },
): MockDatabase {
  const reason = requireText(args.reason, "Say why the material is being written off.");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  const moved = applyMovement(db, {
    batchId: args.batchId,
    fromBucket: "available",
    toBucket: "written_off",
    quantity,
    reason: "written_off",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    notes: reason,
  });

  return appendAudit(moved, {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "quantity_moved",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `${quantity} written off: ${reason}`,
  });
}

/**
 * The custodian's one adjustment: material that spoiled on their floor. Water,
 * pests, a dropped bale. The quantity leaves `at_custodian` for `written_off`
 * so the ledger still balances, and the batch carries the exception until CIRKA
 * clears it.
 */
export function reportStorageDamage(
  db: MockDatabase,
  actor: ViewerScope,
  args: { batchId: Id; quantity: number; reason: string },
): MockDatabase {
  const batch = requireRow(db, "resourceBatches", args.batchId, "Resource batch");
  const reason = requireText(args.reason, "Describe what happened to the material.");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  const holdsIt = db.allocations.some(
    (allocation) =>
      allocation.batchId === args.batchId &&
      allocation.toOrgId === actor.orgId &&
      allocation.hop === "manufacturer_to_custodian" &&
      ["received", "discrepancy", "completed"].includes(allocation.status),
  );

  if (!holdsIt && actor.role !== "admin") {
    throw new OperationError(
      `Only the custodian holding ${batch.reference} can report damage against it.`,
    );
  }

  const moved = applyMovement(db, {
    batchId: args.batchId,
    fromBucket: "at_custodian",
    toBucket: "written_off",
    quantity,
    reason: "written_off",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    notes: reason,
  });

  const flagged = patchRow(moved, "resourceBatches", args.batchId, {
    exceptionStatus: "damaged",
    exceptionNote: `${quantity} ${batch.unit} damaged in storage: ${reason}`,
  });

  return appendAudit(flagged, {
    entityTable: "resourceBatches",
    entityId: args.batchId,
    action: "quantity_moved",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      { field: "exceptionStatus", previousValue: batch.exceptionStatus, newValue: "damaged" },
    ],
    notes: `${quantity} ${batch.unit} damaged in storage and written off: ${reason}`,
  });
}
