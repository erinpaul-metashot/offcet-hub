/**
 * The Retexcir contract, executable.
 *
 * Retexcir is greenfield, so this file is the proposal: the payload CIRKA
 * expects (docs/retexcir_data_requirements.md), the translation from their
 * vocabulary to ours, and the rules that decide whether a record is accepted,
 * accepted-with-gaps, or rejected at the door. The demo pulls real payloads
 * through `mapRetexcirPayload`, so what a viewer sees on screen is the same
 * thing the backend will implement and Retexcir will build against.
 *
 * Every rejection message here is written to be read by a Retexcir engineer.
 */

import { appendAudit } from "../audit";
import {
  MATERIAL_CATEGORY_LABELS,
  QUALITY_CLASS_LABELS,
  RETEXCIR,
  type MaterialCategory,
  type MaterialFormat,
  type QualityClass,
  type Unit,
} from "../domain";
import { makeId } from "../ids";
import type { IntegrationTransfer, MockDatabase, PendingArrival } from "../types";
import type { ViewerScope } from "../visibility";
import { insertRow, OperationError } from "./helpers";
import { findConnection, markConnectionSynced } from "./integrations";
import { now as currentTime } from "../clock";

/** One sorted batch as Retexcir posts it. Mirrors §3 of the requirements doc. */
export interface RetexcirPayload {
  batchId: string;
  facilityId: string;
  materialCategory: string;
  composition?: string;
  quantity?: number;
  unit?: string;
  format?: string;
  qualityGrade?: string;
  color?: string;
  location?: string;
  availableFrom?: string;
  photos?: string[];
  certificates?: string[];
  dashboardUrl?: string;
}

/* ------------------------------------------------------------------ *
 * Translation tables: their vocabulary on the left, ours on the right
 * ------------------------------------------------------------------ */

const CATEGORY_MAP: Record<string, MaterialCategory> = {
  cotton: "cotton_offcuts",
  "cotton offcuts": "cotton_offcuts",
  denim: "denim",
  knit: "knitwear",
  knitwear: "knitwear",
  wool: "wool",
  linen: "linen",
  blended: "polyester_blend",
  polyester: "polyester_blend",
  "poly-cotton": "polyester_blend",
  trims: "trims",
  leather: "leather",
  mixed: "mixed_textile",
};

const UNIT_MAP: Record<string, Unit> = {
  kg: "kg",
  kgs: "kg",
  kilograms: "kg",
  m: "m",
  metres: "m",
  m2: "m2",
  sqm: "m2",
  pieces: "pieces",
  pcs: "pieces",
  garments: "pieces",
  rolls: "rolls",
};

const FORMAT_MAP: Record<string, MaterialFormat> = {
  bale: "bale",
  bales: "bale",
  loose: "loose",
  garment: "garment",
  cut_pieces: "cut_pieces",
  "cut pieces": "cut_pieces",
  roll: "roll",
};

const GRADE_MAP: Record<string, QualityClass> = {
  "a-grade": "a_grade",
  a: "a_grade",
  "b-grade": "b_grade",
  b: "b_grade",
  mixed: "mixed",
  unsorted: "unsorted",
};

function lookup<T>(table: Record<string, T>, value?: string): T | undefined {
  return value ? table[value.trim().toLowerCase()] : undefined;
}

/* ------------------------------------------------------------------ *
 * The mapping
 * ------------------------------------------------------------------ */

export type FieldStatus =
  /** Taken as sent. */
  | "accepted"
  /** Their vocabulary translated into ours. */
  | "translated"
  /** Optional, and they did not send it. */
  | "absent"
  /** CIRKA needs it and nobody can supply it automatically: a human fills it in. */
  | "needs_human"
  /** CIRKA cannot accept the record without it. */
  | "rejected";

export interface MappedField {
  /** The key Retexcir sends. */
  source: string;
  /** Where it lands in CIRKA, or undefined when nothing does. */
  target?: string;
  sent?: string;
  mapped?: string;
  status: FieldStatus;
  note?: string;
}

export interface RetexcirMapping {
  fields: MappedField[];
  /** Set unless the record was rejected. */
  arrival?: Omit<PendingArrival, "_id" | "ownerOrgId" | "arrivedAt" | "status">;
  /** Blocking problems, phrased for whoever maintains the Retexcir side. */
  rejections: string[];
  /** Accepted, but a person has to finish the record before it becomes a batch. */
  gaps: string[];
}

/**
 * Translates one payload and reports, field by field, what CIRKA did with it.
 * Pure: no database, no clock, so both the pull operation and the contract
 * screen can call it.
 */
export function mapRetexcirPayload(payload: RetexcirPayload): RetexcirMapping {
  const fields: MappedField[] = [];
  const rejections: string[] = [];
  const gaps: string[] = [];

  const batchId = payload.batchId?.trim();
  fields.push({
    source: "batchId",
    target: "externalRecordId",
    sent: batchId,
    mapped: batchId,
    status: batchId ? "accepted" : "rejected",
    note: batchId
      ? "Deduplication key: resending it updates the batch instead of creating a second one."
      : undefined,
  });

  if (!batchId) {
    rejections.push("`batchId` is required: CIRKA has no way to deduplicate a record without it.");
  }

  const facilityId = payload.facilityId?.trim();
  fields.push({
    source: "facilityId",
    target: "connection.accountRef",
    sent: facilityId,
    mapped: facilityId,
    status: facilityId ? "accepted" : "rejected",
    note: "Must match the connected CIRKA account, so a record cannot land in the wrong org.",
  });

  if (!facilityId) {
    rejections.push("`facilityId` is required: it decides which CIRKA organisation owns the batch.");
  }

  const category = lookup(CATEGORY_MAP, payload.materialCategory);
  fields.push({
    source: "materialCategory",
    target: "materialCategory",
    sent: payload.materialCategory,
    mapped: category ? MATERIAL_CATEGORY_LABELS[category] : undefined,
    status: category ? "translated" : "rejected",
    note: category
      ? undefined
      : `CIRKA's controlled list is: ${Object.keys(CATEGORY_MAP).join(", ")}.`,
  });

  if (!category) {
    rejections.push(
      `\`materialCategory\` "${payload.materialCategory || "(blank)"}" is not one CIRKA recognises. Send one of: ${Object.keys(CATEGORY_MAP).join(", ")}.`,
    );
  }

  const unit = lookup(UNIT_MAP, payload.unit);
  const quantity = Number.isFinite(payload.quantity) && (payload.quantity ?? 0) > 0 ? payload.quantity : undefined;
  const quantityUsable = quantity !== undefined && unit !== undefined;

  fields.push({
    source: "quantity",
    target: "quantity",
    sent: payload.quantity === undefined ? undefined : String(payload.quantity),
    mapped: quantity === undefined ? undefined : String(quantity),
    status: quantity === undefined ? "needs_human" : "accepted",
    note: quantity === undefined ? "Someone weighs it in CIRKA before the batch can be released." : undefined,
  });

  fields.push({
    source: "unit",
    target: "unit",
    sent: payload.unit,
    mapped: unit,
    status: unit ? "translated" : "needs_human",
    note: unit
      ? undefined
      : `CIRKA counts in ${Object.values(UNIT_MAP).filter((value, index, all) => all.indexOf(value) === index).join(", ")}. "${payload.unit ?? "(blank)"}" is a packing format, not a unit: send the weight as well.`,
  });

  if (!quantityUsable) {
    gaps.push(
      unit
        ? "No usable quantity: a person enters the weight before this becomes a batch."
        : `Unit "${payload.unit ?? "(blank)"}" cannot be counted: a person converts it before this becomes a batch.`,
    );
  }

  fields.push({
    source: "composition",
    target: "composition",
    sent: payload.composition,
    mapped: payload.composition,
    status: payload.composition ? "accepted" : "absent",
    note: payload.composition ? "Recorded as stated, not tested." : undefined,
  });

  const format = lookup(FORMAT_MAP, payload.format);
  fields.push({
    source: "format",
    target: "format",
    sent: payload.format,
    mapped: format,
    status: payload.format ? (format ? "translated" : "absent") : "absent",
  });

  const grade = lookup(GRADE_MAP, payload.qualityGrade);
  fields.push({
    source: "qualityGrade",
    target: "qualityClass",
    sent: payload.qualityGrade,
    mapped: grade ? QUALITY_CLASS_LABELS[grade] : undefined,
    status: payload.qualityGrade ? (grade ? "translated" : "absent") : "absent",
  });

  fields.push({
    source: "color",
    target: "colour",
    sent: payload.color,
    mapped: payload.color,
    status: payload.color ? "accepted" : "absent",
  });

  fields.push({
    source: "location",
    target: "locationText",
    sent: payload.location,
    mapped: payload.location,
    status: payload.location ? "accepted" : "absent",
    note: payload.location ? undefined : "Falls back to the facility on the CIRKA side.",
  });

  const availableFrom = payload.availableFrom ? Date.parse(payload.availableFrom) : undefined;
  fields.push({
    source: "availableFrom",
    target: "availableFrom",
    sent: payload.availableFrom,
    mapped: availableFrom && Number.isFinite(availableFrom) ? payload.availableFrom : undefined,
    status: payload.availableFrom ? "accepted" : "absent",
  });

  fields.push({
    source: "dashboardUrl",
    target: "externalRecordUrl",
    sent: payload.dashboardUrl,
    mapped: payload.dashboardUrl ?? (batchId ? RETEXCIR.recordUrl(batchId) : undefined),
    status: payload.dashboardUrl ? "accepted" : "absent",
    note: payload.dashboardUrl ? undefined : "Derived from `batchId` when Retexcir omits it.",
  });

  fields.push({
    source: "photos / certificates",
    target: "evidenceItems",
    sent: [...(payload.photos ?? []), ...(payload.certificates ?? [])].join(", ") || undefined,
    status: (payload.photos?.length ?? 0) + (payload.certificates?.length ?? 0) > 0 ? "accepted" : "absent",
    note: "Fetched and stored against the batch as evidence.",
  });

  if (rejections.length > 0) {
    return { fields, rejections, gaps };
  }

  return {
    fields,
    rejections,
    gaps,
    arrival: {
      channel: "sorting_system",
      externalSystemName: RETEXCIR.systemName,
      externalRecordId: batchId,
      externalRecordUrl: payload.dashboardUrl ?? RETEXCIR.recordUrl(batchId!),
      name: retexcirRecordName(payload, category!),
      description: describeRecord(payload),
      materialCategory: category,
      quantity: quantityUsable ? quantity : undefined,
      unit: quantityUsable ? unit : undefined,
      composition: payload.composition,
      locationText: payload.location,
      availableFrom:
        availableFrom !== undefined && Number.isFinite(availableFrom) ? availableFrom : undefined,
      format,
      sourcePayload: payload as unknown as Record<string, unknown>,
    },
  };
}

/** Retexcir sends no title, so CIRKA composes one from what it graded. */
function retexcirRecordName(payload: RetexcirPayload, category: MaterialCategory): string {
  const colour = payload.color ? `${payload.color.toLowerCase()} ` : "";
  return `Sorted ${colour}${MATERIAL_CATEGORY_LABELS[category].toLowerCase()}`;
}

function describeRecord(payload: RetexcirPayload): string {
  const grade = lookup(GRADE_MAP, payload.qualityGrade);
  const parts = [
    grade ? `${QUALITY_CLASS_LABELS[grade]} sorted` : "Sorted",
    payload.format ? `and supplied ${payload.format.toLowerCase()}` : undefined,
    `by ${RETEXCIR.systemName} (${payload.batchId}).`,
  ].filter(Boolean);

  return parts.join(" ");
}

/* ------------------------------------------------------------------ *
 * The queue Retexcir has ready for us
 * ------------------------------------------------------------------ */

/**
 * Stands in for the batches sitting in Retexcir waiting to be sent. Two are
 * clean, one is missing a countable quantity, and one uses a category CIRKA
 * does not recognise: the demo has to show a rejection, not just the happy path.
 */
export const RETEXCIR_QUEUE: RetexcirPayload[] = [
  {
    batchId: "RET-2026-8942",
    facilityId: "RETEXCIR-FAC-01",
    materialCategory: "Blended",
    composition: "80% Cotton, 20% Polyester",
    quantity: 500,
    unit: "kg",
    format: "bale",
    qualityGrade: "A-Grade",
    color: "Navy",
    location: "Hamnvägen 3, Norrköping",
    availableFrom: "2026-08-12T00:00:00Z",
    photos: ["https://retexcir.example.com/assets/batch-8942-front.jpg"],
    certificates: ["https://retexcir.example.com/docs/sorting-report-8942.pdf"],
    dashboardUrl: "https://retexcir.example.com/batches/RET-2026-8942",
  },
  {
    batchId: "RET-2026-8951",
    facilityId: "RETEXCIR-FAC-01",
    materialCategory: "Cotton",
    composition: "100% Cotton",
    quantity: 3,
    unit: "bales",
    format: "bale",
    qualityGrade: "B-Grade",
    location: "Hamnvägen 3, Norrköping",
  },
  {
    batchId: "RET-2026-8963",
    facilityId: "RETEXCIR-FAC-01",
    materialCategory: "Wool",
    composition: "70% Wool, 30% Polyamide",
    quantity: 128,
    unit: "kg",
    format: "loose",
    qualityGrade: "Mixed",
    color: "Charcoal",
    location: "Hamnvägen 3, Norrköping",
    certificates: ["https://retexcir.example.com/docs/composition-scan-8963.json"],
  },
  {
    batchId: "RET-2026-8977",
    facilityId: "RETEXCIR-FAC-01",
    materialCategory: "Mixed rags",
    quantity: 240,
    unit: "kg",
    qualityGrade: "Unsorted",
  },
];

/* ------------------------------------------------------------------ *
 * The pull
 * ------------------------------------------------------------------ */

export interface PullRetexcirResult {
  db: MockDatabase;
  accepted: boolean;
  /** What CIRKA would report back to Retexcir. */
  message: string;
}

/**
 * Pulls the next record Retexcir has ready. In production this is the webhook
 * handler: same mapping, same rules, triggered by their POST instead of a
 * button. A rejected record is still recorded as a failed transfer, because a
 * silent drop is how integrations rot.
 */
export function pullRetexcirRecords(
  db: MockDatabase,
  actor: ViewerScope,
): PullRetexcirResult {
  const connection = findConnection(db, actor.orgId, "sorting_system");

  if (!connection) {
    throw new OperationError(
      `Connect your ${RETEXCIR.systemName} account before pulling sorted batches.`,
    );
  }

  const alreadyPulled = db.integrationTransfers.filter(
    (transfer) =>
      transfer.direction === "inbound" &&
      transfer.externalSystemName === RETEXCIR.systemName &&
      ownsTransfer(db, transfer, actor.orgId),
  ).length;

  if (alreadyPulled >= RETEXCIR_QUEUE.length) {
    throw new OperationError(
      `${RETEXCIR.systemName} has nothing new sorted: every record in the queue has already been sent.`,
    );
  }

  const payload = RETEXCIR_QUEUE[alreadyPulled];
  const mapping = mapRetexcirPayload(payload);
  const now = currentTime();

  if (payload.facilityId !== connection.accountRef) {
    mapping.rejections.push(
      `\`facilityId\` "${payload.facilityId}" does not match the connected account ${connection.accountRef}.`,
    );
  }

  if (mapping.rejections.length > 0 || !mapping.arrival) {
    const transfer: IntegrationTransfer = {
      _id: makeId("transfer"),
      entityTable: "integrationConnections",
      entityId: connection._id,
      direction: "inbound",
      externalSystemName: RETEXCIR.systemName,
      externalRecordId: payload.batchId,
      externalRecordUrl: payload.dashboardUrl,
      status: "failed",
      attemptCount: 1,
      lastAttemptAt: now,
      errorMessage: mapping.rejections.join(" "),
      payloadSummary: `${payload.batchId}: rejected, not recorded.`,
      createdAt: now,
    };

    const withTransfer = appendAudit(insertRow(db, "integrationTransfers", transfer), {
      entityTable: "integrationTransfers",
      entityId: transfer._id,
      action: "created",
      actorOrgId: actor.orgId,
      actorType: "api",
      notes: `${RETEXCIR.systemName} record ${payload.batchId} rejected: ${mapping.rejections[0]}`,
    });

    return {
      db: markConnectionSynced(withTransfer, connection._id, now),
      accepted: false,
      message: mapping.rejections.join(" "),
    };
  }

  const arrival: PendingArrival = {
    ...mapping.arrival,
    _id: makeId("arrival"),
    ownerOrgId: actor.orgId,
    arrivedAt: now,
    status: "pending",
  };

  const transfer: IntegrationTransfer = {
    _id: makeId("transfer"),
    entityTable: "pendingArrivals",
    entityId: arrival._id,
    direction: "inbound",
    externalSystemName: RETEXCIR.systemName,
    externalRecordId: payload.batchId,
    externalRecordUrl: arrival.externalRecordUrl,
    status: "success",
    attemptCount: 1,
    lastAttemptAt: now,
    succeededAt: now,
    payloadSummary:
      mapping.gaps.length > 0
        ? `${payload.batchId}: accepted with ${mapping.gaps.length} gap${mapping.gaps.length === 1 ? "" : "s"} for a human.`
        : `${payload.batchId}: accepted, awaiting confirmation.`,
    createdAt: now,
  };

  const withRows = insertRow(insertRow(db, "pendingArrivals", arrival), "integrationTransfers", transfer);

  const withAudit = appendAudit(withRows, {
    entityTable: "pendingArrivals",
    entityId: arrival._id,
    action: "created",
    actorOrgId: actor.orgId,
    actorType: "api",
    notes: `${RETEXCIR.systemName} sent record ${payload.batchId}.`,
  });

  return {
    db: markConnectionSynced(withAudit, connection._id, now),
    accepted: true,
    message: transfer.payloadSummary!,
  };
}

/** Transfers carry no org of their own: ownership comes from what they point at. */
export function ownsTransfer(
  db: MockDatabase,
  transfer: IntegrationTransfer,
  orgId: string,
): boolean {
  if (transfer.entityTable === "pendingArrivals") {
    return db.pendingArrivals.some(
      (arrival) => arrival._id === transfer.entityId && arrival.ownerOrgId === orgId,
    );
  }

  if (transfer.entityTable === "integrationConnections") {
    return db.integrationConnections.some(
      (connection) => connection._id === transfer.entityId && connection.orgId === orgId,
    );
  }

  if (transfer.entityTable === "resourceBatches") {
    return db.resourceBatches.some(
      (batch) => batch._id === transfer.entityId && batch.ownerOrgId === orgId,
    );
  }

  return false;
}
