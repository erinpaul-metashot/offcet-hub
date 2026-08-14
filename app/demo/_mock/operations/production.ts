/** Production batches, inputs, time, outputs, costs, suitability and evidence. */

import { appendAudit } from "../audit";
import type {
  EvidenceKind,
  InputType,
  ProductCategory,
  ProductionStatus,
  SourcingCategory,
  SuitabilityRating,
  TimeActivity,
} from "../domain";
import { makeId, makeReference } from "../ids";
import { applyMovement, round } from "../ledger";
import { assertProductionTransition, checkMaterialBalance, materialYield } from "../transitions";
import type {
  Id,
  MockDatabase,
  ProductionBatch,
  ProductionCost,
  ProductionInput,
  ProductionOutput,
  ProductionTimeEntry,
  SuitabilityFeedback,
} from "../types";
import type { ViewerScope } from "../visibility";
import {
  OperationError,
  insertRow,
  nextSequence,
  patchRow,
  removeRow,
  requirePositive,
  requireRow,
  requireText,
} from "./helpers";
import { now as currentTime } from "../clock";

export interface CreateProductionInput {
  allocationId: Id;
  productCategory: ProductCategory;
  productName: string;
  productDescription?: string;
  plannedQuantity: number;
  plannedStartDate?: number;
  plannedCompletionDate?: number;
  productionFacilityId?: Id;
}

export function createProductionBatch(
  db: MockDatabase,
  actor: ViewerScope,
  input: CreateProductionInput,
): { db: MockDatabase; productionBatchId: Id } {
  const allocation = requireRow(db, "allocations", input.allocationId, "Allocation");
  const productName = requireText(input.productName, "Name the product or collection.");
  const plannedQuantity = requirePositive(
    input.plannedQuantity,
    "Planned quantity must be greater than zero.",
  );

  if (db.productionBatches.some((entry) => entry.allocationId === input.allocationId)) {
    throw new OperationError("This allocation already has a production batch.");
  }

  const productionBatchId = makeId("production");
  const now = currentTime();

  const production: ProductionBatch = {
    _id: productionBatchId,
    reference: makeReference(
      "PB",
      nextSequence(
        db.productionBatches.map((entry) => entry.reference),
        "CIRKA-PB",
      ),
    ),
    allocationId: allocation._id,
    batchId: allocation.batchId,
    projectId: allocation.projectId,
    makerOrgId: actor.orgId,
    productionFacilityId:
      input.productionFacilityId ??
      db.facilities.find(
        (facility) => facility.orgId === actor.orgId && facility.type === "production",
      )?._id,
    productCategory: input.productCategory,
    productName,
    productDescription: input.productDescription?.trim() || undefined,
    plannedQuantity,
    plannedStartDate: input.plannedStartDate,
    plannedCompletionDate: input.plannedCompletionDate,
    status: allocation.status === "received" ? "material_received" : "awaiting_material",
    qtyAllocated: allocation.quantityAllocated,
    qtyReceived: allocation.quantityReceived,
    unit: allocation.unit,
    evidenceStatus: "maker_reported",
    createdAt: now,
    updatedAt: now,
  };

  const withProduction = insertRow(db, "productionBatches", production);

  return {
    db: appendAudit(withProduction, {
      entityTable: "productionBatches",
      entityId: productionBatchId,
      parentEntityTable: "resourceBatches",
      parentEntityId: allocation.batchId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      notes: `Production batch created against ${allocation.reference}.`,
    }),
    productionBatchId,
  };
}

export function setProductionStatus(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id; status: ProductionStatus; note?: string },
): MockDatabase {
  const production = requireRow(db, "productionBatches", args.productionBatchId, "Production batch");
  assertProductionTransition(production.status, args.status);

  if (args.status === "completed") {
    throw new OperationError("Use Complete production so the material balance is checked.");
  }

  const patch: Partial<ProductionBatch> = { status: args.status, updatedAt: currentTime() };

  if (args.status === "in_production" && !production.actualStartDate) {
    patch.actualStartDate = currentTime();
  }

  const updated = patchRow(db, "productionBatches", args.productionBatchId, patch);

  return appendAudit(updated, {
    entityTable: "productionBatches",
    entityId: args.productionBatchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: production.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: production.status, newValue: args.status }],
    notes: args.note,
  });
}

export interface MaterialUseInput {
  productionBatchId: Id;
  qtyReceived?: number;
  qtyUsed?: number;
  qtyIncorporated?: number;
  qtyPrototypes?: number;
  qtyReusableRemaining?: number;
  qtyOffcuts?: number;
  qtyLoss?: number;
  qtyReturned?: number;
  actualQuantity?: number;
  makerNotes?: string;
}

export function recordMaterialUse(
  db: MockDatabase,
  actor: ViewerScope,
  input: MaterialUseInput,
): MockDatabase {
  const production = requireRow(db, "productionBatches", input.productionBatchId, "Production batch");

  const patch: Partial<ProductionBatch> = {
    qtyReceived: input.qtyReceived ?? production.qtyReceived,
    qtyUsed: input.qtyUsed ?? production.qtyUsed,
    qtyIncorporated: input.qtyIncorporated ?? production.qtyIncorporated,
    qtyPrototypes: input.qtyPrototypes ?? production.qtyPrototypes,
    qtyReusableRemaining: input.qtyReusableRemaining ?? production.qtyReusableRemaining,
    qtyOffcuts: input.qtyOffcuts ?? production.qtyOffcuts,
    qtyLoss: input.qtyLoss ?? production.qtyLoss,
    qtyReturned: input.qtyReturned ?? production.qtyReturned,
    actualQuantity: input.actualQuantity ?? production.actualQuantity,
    makerNotes: input.makerNotes?.trim() || production.makerNotes,
    updatedAt: currentTime(),
  };

  patch.materialYield = materialYield({
    qtyIncorporated: patch.qtyIncorporated,
    qtyUsed: patch.qtyUsed,
  });

  const updated = patchRow(db, "productionBatches", input.productionBatchId, patch);

  return appendAudit(updated, {
    entityTable: "productionBatches",
    entityId: input.productionBatchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: production.batchId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: "Material use recorded.",
  });
}

/**
 * A production batch cannot reach Completed until its material numbers balance
 * (05_SYSTEM_DESIGN §4). Only then does the material leave the maker's pot.
 */
export function completeProduction(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id },
): MockDatabase {
  const production = requireRow(db, "productionBatches", args.productionBatchId, "Production batch");
  assertProductionTransition(production.status, "completed");

  const balance = checkMaterialBalance(production);

  if (!balance.balanced) {
    throw new OperationError(balance.problems.join(" "));
  }

  const consumed = round((production.qtyIncorporated ?? 0) + (production.qtyPrototypes ?? 0));
  const offcuts = round(production.qtyOffcuts ?? 0);
  const loss = round(production.qtyLoss ?? 0);
  const backToStock = round((production.qtyReusableRemaining ?? 0) + (production.qtyReturned ?? 0));

  let moved = db;

  if (consumed > 0) {
    moved = applyMovement(moved, {
      batchId: production.batchId,
      fromBucket: "with_maker",
      toBucket: "consumed",
      quantity: consumed,
      reason: "consumed",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      productionBatchId: production._id,
      notes: `Transformed in ${production.reference}.`,
    });
  }

  if (offcuts > 0) {
    moved = applyMovement(moved, {
      batchId: production.batchId,
      fromBucket: "with_maker",
      toBucket: "available",
      quantity: offcuts,
      reason: "offcut_returned",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      productionBatchId: production._id,
      notes: "Reusable offcuts returned to stock.",
    });
  }

  if (loss > 0) {
    moved = applyMovement(moved, {
      batchId: production.batchId,
      fromBucket: "with_maker",
      toBucket: "written_off",
      quantity: loss,
      reason: "written_off",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      productionBatchId: production._id,
      notes: "Unusable production loss.",
    });
  }

  if (backToStock > 0) {
    moved = applyMovement(moved, {
      batchId: production.batchId,
      fromBucket: "with_maker",
      toBucket: "available",
      quantity: backToStock,
      reason: "returned",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      productionBatchId: production._id,
      notes: "Unused material returned to stock.",
    });
  }

  const outputs = moved.productionOutputs.filter(
    (output) => output.productionBatchId === production._id,
  );
  const completedUnits = outputs.reduce((total, output) => total + (output.numberCompleted ?? 0), 0);
  const hours = moved.productionTimeEntries
    .filter((entry) => entry.productionBatchId === production._id)
    .reduce((total, entry) => total + entry.hours, 0);

  const updated = patchRow(moved, "productionBatches", args.productionBatchId, {
    status: "completed",
    actualCompletionDate: currentTime(),
    actualQuantity: completedUnits > 0 ? completedUnits : production.actualQuantity,
    totalLabourHours: hours > 0 ? round(hours) : production.totalLabourHours,
    hoursPerSaleableUnit:
      hours > 0 && completedUnits > 0 ? round(hours / completedUnits) : production.hoursPerSaleableUnit,
    materialYield: materialYield(production),
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "productionBatches",
    entityId: args.productionBatchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: production.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: production.status, newValue: "completed" }],
    notes: `Material balanced: ${balance.received} ${production.unit} received, ${balance.used} used.`,
  });
}

export function submitEvidence(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id; makerNotes?: string },
): MockDatabase {
  const production = requireRow(db, "productionBatches", args.productionBatchId, "Production batch");
  assertProductionTransition(production.status, "evidence_submitted");

  const hasEvidence = db.evidenceItems.some(
    (item) => item.entityTable === "productionBatches" && item.entityId === production._id,
  );

  if (!hasEvidence) {
    throw new OperationError("Add at least one photo or file before submitting evidence.");
  }

  const updated = patchRow(db, "productionBatches", args.productionBatchId, {
    status: "evidence_submitted",
    evidenceStatus: "evidence_submitted",
    evidenceSubmittedAt: currentTime(),
    makerNotes: args.makerNotes?.trim() || production.makerNotes,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "productionBatches",
    entityId: args.productionBatchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: production.batchId,
    action: "submitted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      { field: "evidenceStatus", previousValue: production.evidenceStatus, newValue: "evidence_submitted" },
    ],
    notes: args.makerNotes,
  });
}

export function reviewEvidence(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id; approve: boolean; reviewNotes?: string },
): MockDatabase {
  const production = requireRow(db, "productionBatches", args.productionBatchId, "Production batch");
  const next = args.approve ? "cirka_reviewed" : "in_production";
  assertProductionTransition(production.status, next);

  if (!args.approve) {
    requireText(args.reviewNotes, "Say what needs more detail before sending it back.");
  }

  const updated = patchRow(db, "productionBatches", args.productionBatchId, {
    status: next,
    evidenceStatus: args.approve ? "cirka_reviewed" : "maker_reported",
    reviewedByUserId: actor.userId,
    reviewedAt: currentTime(),
    reviewNotes: args.reviewNotes?.trim() || undefined,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "productionBatches",
    entityId: args.productionBatchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: production.batchId,
    action: "reviewed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      {
        field: "evidenceStatus",
        previousValue: production.evidenceStatus,
        newValue: args.approve ? "cirka_reviewed" : "maker_reported",
      },
    ],
    notes: args.reviewNotes,
  });
}

/* ------------------------------------------------------------------ *
 * Repeatable rows: inputs, time, outputs
 * ------------------------------------------------------------------ */

export function addProductionInput(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    productionBatchId: Id;
    inputType: InputType;
    description: string;
    quantity: number;
    unit: string;
    supplierName?: string;
    cost?: number;
    sourcingCategory: SourcingCategory;
  },
): MockDatabase {
  const description = requireText(args.description, "Describe the input.");
  const quantity = requirePositive(args.quantity, "Quantity must be greater than zero.");

  const row: ProductionInput = {
    _id: makeId("input"),
    productionBatchId: args.productionBatchId,
    inputType: args.inputType,
    description,
    quantity,
    unit: requireText(args.unit, "Give the unit for this input."),
    supplierName: args.supplierName?.trim() || undefined,
    cost: args.cost,
    currency: args.cost !== undefined ? "SEK" : undefined,
    sourcingCategory: args.sourcingCategory,
    createdAt: currentTime(),
  };

  return appendAudit(insertRow(db, "productionInputs", row), {
    entityTable: "productionInputs",
    entityId: row._id,
    parentEntityTable: "productionBatches",
    parentEntityId: args.productionBatchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Input added: ${description}.`,
  });
}

export function removeProductionInput(
  db: MockDatabase,
  actor: ViewerScope,
  args: { inputId: Id },
): MockDatabase {
  const row = requireRow(db, "productionInputs", args.inputId, "Production input");

  return appendAudit(removeRow(db, "productionInputs", args.inputId), {
    entityTable: "productionInputs",
    entityId: args.inputId,
    parentEntityTable: "productionBatches",
    parentEntityId: row.productionBatchId,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
  });
}

function recomputeTime(db: MockDatabase, productionBatchId: Id): MockDatabase {
  const production = db.productionBatches.find((entry) => entry._id === productionBatchId);

  if (!production) {
    return db;
  }

  const entries = db.productionTimeEntries.filter(
    (entry) => entry.productionBatchId === productionBatchId,
  );
  const hours = round(entries.reduce((total, entry) => total + entry.hours, 0));
  const people = entries.reduce((most, entry) => Math.max(most, entry.peopleInvolved ?? 0), 0);
  const units = production.actualQuantity ?? production.plannedQuantity;

  return patchRow(db, "productionBatches", productionBatchId, {
    totalLabourHours: hours,
    peopleInvolved: people > 0 ? people : production.peopleInvolved,
    timeIsEstimated: entries.some((entry) => entry.isEstimated),
    hoursPerSaleableUnit: units > 0 ? round(hours / units) : undefined,
    updatedAt: currentTime(),
  });
}

export function addTimeEntry(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    productionBatchId: Id;
    activity: TimeActivity;
    hours: number;
    peopleInvolved?: number;
    isEstimated: boolean;
    notes?: string;
  },
): MockDatabase {
  const hours = requirePositive(args.hours, "Hours must be greater than zero.");

  const row: ProductionTimeEntry = {
    _id: makeId("time"),
    productionBatchId: args.productionBatchId,
    activity: args.activity,
    hours,
    peopleInvolved: args.peopleInvolved,
    isEstimated: args.isEstimated,
    entryDate: currentTime(),
    notes: args.notes?.trim() || undefined,
    createdAt: currentTime(),
  };

  const withRow = recomputeTime(insertRow(db, "productionTimeEntries", row), args.productionBatchId);

  return appendAudit(withRow, {
    entityTable: "productionTimeEntries",
    entityId: row._id,
    parentEntityTable: "productionBatches",
    parentEntityId: args.productionBatchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `${hours} hours recorded against ${args.activity.replace(/_/g, " ")}.`,
  });
}

export function removeTimeEntry(
  db: MockDatabase,
  actor: ViewerScope,
  args: { timeEntryId: Id },
): MockDatabase {
  const row = requireRow(db, "productionTimeEntries", args.timeEntryId, "Time entry");
  const removed = recomputeTime(
    removeRow(db, "productionTimeEntries", args.timeEntryId),
    row.productionBatchId,
  );

  return appendAudit(removed, {
    entityTable: "productionTimeEntries",
    entityId: args.timeEntryId,
    parentEntityTable: "productionBatches",
    parentEntityId: row.productionBatchId,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
  });
}

export function addProductionOutput(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    productionBatchId: Id;
    productName: string;
    productCategory: ProductCategory;
    productDescription?: string;
    numberPlanned: number;
    numberCompleted?: number;
    numberRejected?: number;
    numberRequiringRework?: number;
    unitWeight?: number;
    notes?: string;
  },
): MockDatabase {
  const productName = requireText(args.productName, "Name the finished product.");
  const numberPlanned = requirePositive(args.numberPlanned, "Planned units must be greater than zero.");

  const row: ProductionOutput = {
    _id: makeId("output"),
    productionBatchId: args.productionBatchId,
    productName,
    productCategory: args.productCategory,
    productDescription: args.productDescription?.trim() || undefined,
    numberPlanned,
    numberCompleted: args.numberCompleted,
    numberRejected: args.numberRejected,
    numberRequiringRework: args.numberRequiringRework,
    unitWeight: args.unitWeight,
    weightUnit: args.unitWeight !== undefined ? "kg" : undefined,
    finishedImageUrls: [],
    notes: args.notes?.trim() || undefined,
    createdAt: currentTime(),
  };

  return appendAudit(insertRow(db, "productionOutputs", row), {
    entityTable: "productionOutputs",
    entityId: row._id,
    parentEntityTable: "productionBatches",
    parentEntityId: args.productionBatchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Output line added: ${productName}.`,
  });
}

/* ------------------------------------------------------------------ *
 * Costs: restricted to the maker and CIRKA
 * ------------------------------------------------------------------ */

export type CostInput = Partial<
  Pick<
    ProductionCost,
    | "resourceCost"
    | "additionalInputCost"
    | "labourCost"
    | "treatmentCost"
    | "packagingCost"
    | "transportCost"
    | "custodianFees"
    | "otherCosts"
    | "saleableUnits"
    | "intendedWholesalePrice"
    | "intendedRetailPrice"
    | "actualSellingPrice"
    | "unitsSold"
  >
>;

export function upsertProductionCosts(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id; input: CostInput },
): MockDatabase {
  const production = requireRow(db, "productionBatches", args.productionBatchId, "Production batch");
  const existing = db.productionCosts.find(
    (cost) => cost.productionBatchId === args.productionBatchId,
  );

  const merged = { ...existing, ...args.input };
  const totalBatchCost = round(
    (merged.resourceCost ?? 0) +
      (merged.additionalInputCost ?? 0) +
      (merged.labourCost ?? 0) +
      (merged.treatmentCost ?? 0) +
      (merged.packagingCost ?? 0) +
      (merged.transportCost ?? 0) +
      (merged.custodianFees ?? 0) +
      (merged.otherCosts ?? 0),
  );

  const saleableUnits = merged.saleableUnits ?? production.actualQuantity;
  const baseCostPerUnit =
    saleableUnits && saleableUnits > 0 ? round(totalBatchCost / saleableUnits) : undefined;
  const revenueGenerated =
    merged.actualSellingPrice !== undefined && merged.unitsSold !== undefined
      ? round(merged.actualSellingPrice * merged.unitsSold)
      : existing?.revenueGenerated;

  const patch = {
    ...args.input,
    totalBatchCost,
    saleableUnits,
    baseCostPerUnit,
    revenueGenerated,
    updatedAt: currentTime(),
  };

  const next = existing
    ? patchRow(db, "productionCosts", existing._id, patch)
    : insertRow(db, "productionCosts", {
        _id: makeId("cost"),
        productionBatchId: args.productionBatchId,
        makerOrgId: actor.orgId,
        currency: "SEK",
        shareCostPerUnitWithBrand: false,
        createdAt: currentTime(),
        ...patch,
      } as ProductionCost);

  return appendAudit(next, {
    entityTable: "productionCosts",
    entityId: existing?._id ?? args.productionBatchId,
    parentEntityTable: "productionBatches",
    parentEntityId: args.productionBatchId,
    action: existing ? "updated" : "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: "Production costs recorded. Visible to the maker and CIRKA only.",
  });
}

/** The maker's explicit opt-in to sharing cost per unit with the brand. */
export function setCostSharing(
  db: MockDatabase,
  actor: ViewerScope,
  args: { productionBatchId: Id; share: boolean },
): MockDatabase {
  const cost = db.productionCosts.find(
    (entry) => entry.productionBatchId === args.productionBatchId,
  );

  if (!cost) {
    throw new OperationError("Record the costs before choosing what to share.");
  }

  const updated = patchRow(db, "productionCosts", cost._id, {
    shareCostPerUnitWithBrand: args.share,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "productionCosts",
    entityId: cost._id,
    parentEntityTable: "productionBatches",
    parentEntityId: args.productionBatchId,
    action: "permission_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      {
        field: "shareCostPerUnitWithBrand",
        previousValue: String(cost.shareCostPerUnitWithBrand),
        newValue: String(args.share),
      },
    ],
    notes: args.share
      ? "Maker opted in to sharing cost per unit with the commissioning brand."
      : "Maker withdrew cost-per-unit sharing.",
  });
}

/* ------------------------------------------------------------------ *
 * Suitability feedback and evidence files
 * ------------------------------------------------------------------ */

export function submitSuitabilityFeedback(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    allocationId: Id;
    receivedAsDescribed: boolean;
    suitability: SuitabilityRating;
    qualityRating?: number;
    damageNote?: string;
    contaminationNote?: string;
    recommendedApplications?: string;
    limitations?: string;
    notes?: string;
  },
): MockDatabase {
  const allocation = requireRow(db, "allocations", args.allocationId, "Allocation");

  if (db.suitabilityFeedback.some((entry) => entry.allocationId === args.allocationId)) {
    throw new OperationError("Suitability feedback has already been recorded for this allocation.");
  }

  const row: SuitabilityFeedback = {
    _id: makeId("suitability"),
    allocationId: allocation._id,
    batchId: allocation.batchId,
    makerOrgId: actor.orgId,
    submittedByUserId: actor.userId,
    receivedAsDescribed: args.receivedAsDescribed,
    suitability: args.suitability,
    qualityRating: args.qualityRating,
    damageNote: args.damageNote?.trim() || undefined,
    contaminationNote: args.contaminationNote?.trim() || undefined,
    recommendedApplications: args.recommendedApplications?.trim() || undefined,
    limitations: args.limitations?.trim() || undefined,
    notes: args.notes?.trim() || undefined,
    imageUrls: [],
    createdAt: currentTime(),
  };

  return appendAudit(insertRow(db, "suitabilityFeedback", row), {
    entityTable: "suitabilityFeedback",
    entityId: row._id,
    parentEntityTable: "resourceBatches",
    parentEntityId: allocation.batchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Material assessed as ${args.suitability.replace(/_/g, " ")}.`,
  });
}

export function addEvidenceItem(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    entityTable: string;
    entityId: Id;
    kind: EvidenceKind;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    sizeBytes?: number;
    caption?: string;
    containsPeople?: boolean;
    visibility?: "private" | "cirka" | "project_participants" | "brand" | "public";
  },
): MockDatabase {
  const row = {
    _id: makeId("evidence"),
    fileUrl: args.fileUrl,
    entityTable: args.entityTable,
    entityId: args.entityId,
    kind: args.kind,
    fileName: requireText(args.fileName, "Give the file a name."),
    mimeType: args.mimeType ?? "image/jpeg",
    sizeBytes: args.sizeBytes ?? 640_000,
    uploadedByUserId: actor.userId,
    uploadedByOrgId: actor.orgId,
    visibility: args.visibility ?? "project_participants",
    caption: args.caption?.trim() || undefined,
    containsPeople: args.containsPeople,
    createdAt: currentTime(),
  };

  return appendAudit(insertRow(db, "evidenceItems", row), {
    entityTable: "evidenceItems",
    entityId: row._id,
    parentEntityTable: args.entityTable,
    parentEntityId: args.entityId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Evidence uploaded: ${row.fileName}.`,
  });
}
