/**
 * Confirmation queue for records a connected system (ERP, sorting tech)
 * pushes at CIRKA (05_SYSTEM_DESIGN §7.4). Confirming an arrival hands its
 * fields to `createResourceBatch` — the same write path the manual form and
 * the CSV importer use — so validation, dedupe on the external key, and
 * provenance stamping all stay in one place.
 */

import { appendAudit } from "../audit";
import type { MaterialCategory, MaterialFormat, Unit } from "../domain";
import { makeId } from "../ids";
import type { Id, MockDatabase, PendingArrival } from "../types";
import type { ViewerScope } from "../visibility";
import { createResourceBatch, type CreateBatchInput } from "./batches";
import { insertRow, OperationError, patchRow, requireRow } from "./helpers";

interface ArrivalTemplate {
  recordSuffix: string;
  name: string;
  description?: string;
  materialCategory?: MaterialCategory;
  quantity?: number;
  unit?: Unit;
  composition?: string;
  locationText?: string;
  format?: MaterialFormat;
}

const ARRIVAL_TEMPLATES: Record<"erp_import" | "sorting_system", ArrivalTemplate[]> = {
  erp_import: [
    {
      recordSuffix: "0412",
      name: "Denim selvedge offcuts",
      description: "Selvedge trims from the latest denim cutting run.",
      materialCategory: "denim",
      quantity: 96,
      unit: "kg",
      composition: "100% cotton",
      locationText: "Industrigatan 14, Norrköping",
    },
    {
      recordSuffix: "0413",
      name: "Mixed knit panel surplus",
      description: "Cancelled order panels held in quarantine.",
      materialCategory: "knitwear",
      quantity: 212,
      unit: "kg",
      locationText: "Industrigatan 14, Norrköping",
    },
  ],
  sorting_system: [
    {
      recordSuffix: "203",
      name: "Sorted cotton fines",
      materialCategory: "cotton_offcuts",
      locationText: "Hamnvägen 3, Norrköping",
    },
    {
      recordSuffix: "204",
      name: "Sorted wool blend",
      description: "Blend flagged by the optical sorter for a manual composition check.",
      materialCategory: "wool",
      quantity: 54,
      unit: "kg",
    },
  ],
};

export interface ReceiveArrivalInput {
  channel: "erp_import" | "sorting_system";
  externalSystemName: string;
}

/** Stands in for a connected system pushing its next record at CIRKA. */
export function receiveArrival(
  db: MockDatabase,
  actor: ViewerScope,
  input: ReceiveArrivalInput,
): MockDatabase {
  const receivedForChannel = db.pendingArrivals.filter(
    (arrival) => arrival.ownerOrgId === actor.orgId && arrival.channel === input.channel,
  ).length;

  const templates = ARRIVAL_TEMPLATES[input.channel];
  const template = templates[receivedForChannel % templates.length];
  const prefix = input.channel === "erp_import" ? "ERP" : "SORT";
  const now = Date.now();

  const arrival: PendingArrival = {
    _id: makeId("arrival"),
    ownerOrgId: actor.orgId,
    channel: input.channel,
    externalSystemName: input.externalSystemName,
    externalRecordId: `${prefix}-${now}-${template.recordSuffix}`,
    name: template.name,
    description: template.description,
    materialCategory: template.materialCategory,
    quantity: template.quantity,
    unit: template.unit,
    composition: template.composition,
    locationText: template.locationText,
    format: template.format,
    arrivedAt: now,
    status: "pending",
  };

  return appendAudit(insertRow(db, "pendingArrivals", arrival), {
    entityTable: "pendingArrivals",
    entityId: arrival._id,
    action: "created",
    actorOrgId: actor.orgId,
    actorType: "system",
    notes: `${input.externalSystemName} pushed a new record.`,
  });
}

export type ArrivalCorrection = Partial<
  Pick<
    CreateBatchInput,
    "name" | "description" | "materialCategory" | "quantity" | "unit" | "composition" | "locationText" | "format"
  >
>;

export interface ConfirmArrivalResult {
  db: MockDatabase;
  batchId: Id;
}

/** Confirms a pushed record into a real resource batch, with optional field corrections. */
export function confirmArrival(
  db: MockDatabase,
  actor: ViewerScope,
  arrivalId: Id,
  correction?: ArrivalCorrection,
): ConfirmArrivalResult {
  const arrival = requireRow(db, "pendingArrivals", arrivalId, "Arrival");

  if (arrival.status !== "pending") {
    throw new OperationError("This record has already been resolved.");
  }

  const result = createResourceBatch(db, actor, {
    name: correction?.name ?? arrival.name ?? "",
    description: correction?.description ?? arrival.description ?? "",
    materialCategory: (correction?.materialCategory ?? arrival.materialCategory) as MaterialCategory,
    quantity: correction?.quantity ?? arrival.quantity ?? 0,
    unit: (correction?.unit ?? arrival.unit) as Unit,
    composition: correction?.composition ?? arrival.composition,
    locationText: correction?.locationText ?? arrival.locationText,
    availableFrom: arrival.availableFrom,
    format: correction?.format ?? arrival.format,
    dataSource: arrival.channel,
    externalSystemName: arrival.externalSystemName,
    externalRecordId: arrival.externalRecordId,
    ownerOrgId: arrival.ownerOrgId,
  });

  const patched = patchRow(result.db, "pendingArrivals", arrivalId, {
    status: "confirmed",
    resolvedBatchId: result.batchId,
    resolvedAt: Date.now(),
  });

  return {
    db: appendAudit(patched, {
      entityTable: "pendingArrivals",
      entityId: arrivalId,
      action: "status_changed",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      fieldChanges: [{ field: "status", previousValue: "pending", newValue: "confirmed" }],
      notes: `Confirmed into resource batch ${result.batchId}.`,
    }),
    batchId: result.batchId,
  };
}

/** Discards a pushed record without creating a batch. */
export function skipArrival(db: MockDatabase, actor: ViewerScope, arrivalId: Id): MockDatabase {
  const arrival = requireRow(db, "pendingArrivals", arrivalId, "Arrival");

  if (arrival.status !== "pending") {
    throw new OperationError("This record has already been resolved.");
  }

  const patched = patchRow(db, "pendingArrivals", arrivalId, {
    status: "skipped",
    resolvedAt: Date.now(),
  });

  return appendAudit(patched, {
    entityTable: "pendingArrivals",
    entityId: arrivalId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: "pending", newValue: "skipped" }],
    notes: "Skipped — not recorded as a resource batch.",
  });
}
