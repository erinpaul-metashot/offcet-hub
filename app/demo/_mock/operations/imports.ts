/**
 * Getting data in (05_SYSTEM_DESIGN §7).
 *
 * Upload → preview → fix or skip → commit → report. Nothing is written until
 * the commit step, and every created batch keeps a link back to its import job.
 * The commit calls the same `createResourceBatch` the manual form calls.
 */

import { appendAudit } from "../audit";
import { MATERIAL_CATEGORIES, UNITS } from "../domain";
import type { ImportSource, MaterialCategory, Unit } from "../domain";
import { makeId } from "../ids";
import type { Id, ImportJob, ImportRowError, MockDatabase } from "../types";
import type { ViewerScope } from "../visibility";
import { createResourceBatch } from "./batches";
import { insertRow, patchRow } from "./helpers";
import { now as currentTime } from "../clock";

export const IMPORT_COLUMNS = [
  "name",
  "description",
  "materialCategory",
  "quantity",
  "unit",
  "composition",
  "locationText",
  "externalRecordId",
] as const;

export interface ParsedRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ValidatedRow extends ParsedRow {
  valid: boolean;
  errors: ImportRowError[];
}

/** Deliberately small CSV reader: quoted fields with commas are supported. */
export function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = splitCsvLine(lines[0]).map((column) => column.trim());

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const values = header.reduce<Record<string, string>>((row, column, position) => {
      return { ...row, [column]: (cells[position] ?? "").trim() };
    }, {});

    return { rowNumber: index + 1, values };
  });
}

export function splitCsvLine(line: string, delimiter = ","): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of line) {
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current);
  return cells;
}

export interface DelimitedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Reads a pasted or uploaded sheet without assuming its columns already match
 * CIRKA's schema: that mapping happens client-side in the mapping wizard.
 * Sniffs `;` vs `,` from the header line so sheets exported by locales that
 * use a comma decimal separator still parse correctly.
 */
export function parseDelimitedSheet(text: string): DelimitedSheet {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((column) => column.trim());

  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    return headers.reduce<Record<string, string>>((row, column, position) => {
      return { ...row, [column]: (cells[position] ?? "").trim() };
    }, {});
  });

  return { headers, rows };
}

export function validateRows(rows: ParsedRow[]): ValidatedRow[] {
  return rows.map((row) => {
    const errors: ImportRowError[] = [];
    const { values, rowNumber } = row;

    if (!values.name) {
      errors.push({ rowNumber, field: "name", message: "Name is required." });
    }

    if (!values.description) {
      errors.push({ rowNumber, field: "description", message: "Description is required." });
    }

    if (!MATERIAL_CATEGORIES.includes(values.materialCategory as MaterialCategory)) {
      errors.push({
        rowNumber,
        field: "materialCategory",
        message: `Unknown category "${values.materialCategory || "(blank)"}". Use one of: ${MATERIAL_CATEGORIES.join(", ")}.`,
      });
    }

    const quantity = Number(values.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({
        rowNumber,
        field: "quantity",
        message: `Quantity must be a positive number: found "${values.quantity || "(blank)"}".`,
      });
    }

    if (!UNITS.includes(values.unit as Unit)) {
      errors.push({
        rowNumber,
        field: "unit",
        message: `Unknown unit "${values.unit || "(blank)"}". Use one of: ${UNITS.join(", ")}.`,
      });
    }

    return { ...row, valid: errors.length === 0, errors };
  });
}

export interface CommitImportResult {
  db: MockDatabase;
  jobId: Id;
  created: number;
  updated: number;
  failed: number;
}

export function commitImport(
  db: MockDatabase,
  actor: ViewerScope,
  args: {
    fileName?: string;
    source: ImportSource;
    rows: ValidatedRow[];
    externalSystemName?: string;
  },
): CommitImportResult {
  const jobId = makeId("import");
  const validRows = args.rows.filter((row) => row.valid);
  const failedRows = args.rows.filter((row) => !row.valid);

  const job: ImportJob = {
    _id: jobId,
    orgId: actor.orgId,
    uploadedByUserId: actor.userId,
    source: args.source,
    fileName: args.fileName,
    targetTable: "resourceBatches",
    status: "committing",
    rowCount: args.rows.length,
    validCount: validRows.length,
    failedCount: failedRows.length,
    rowErrors: failedRows.flatMap((row) => row.errors),
    createdAt: currentTime(),
  };

  const startingCount = db.resourceBatches.length;

  const withBatches = validRows.reduce((current, row) => {
    const result = createResourceBatch(current, actor, {
      name: row.values.name,
      description: row.values.description,
      materialCategory: row.values.materialCategory as MaterialCategory,
      composition: row.values.composition || undefined,
      quantity: Number(row.values.quantity),
      unit: row.values.unit as Unit,
      locationText: row.values.locationText || undefined,
      dataSource: args.source,
      externalSystemName: args.externalSystemName,
      externalRecordId: row.values.externalRecordId || undefined,
      importJobId: jobId,
      releaseImmediately: false,
    });

    return result.db;
  }, insertRow(db, "importJobs", job));

  const created = withBatches.resourceBatches.length - startingCount;
  const updated = validRows.length - created;

  const completed = patchRow(withBatches, "importJobs", jobId, {
    status: failedRows.length === validRows.length && validRows.length === 0 ? "failed" : "completed",
    createdCount: created,
    updatedCount: updated,
    completedAt: currentTime(),
  });

  return {
    db: appendAudit(completed, {
      entityTable: "importJobs",
      entityId: jobId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      actorType: args.source === "csv_import" ? "import" : "api",
      notes: `${created} batches created, ${updated} updated, ${failedRows.length} rows failed.`,
    }),
    jobId,
    created,
    updated,
    failed: failedRows.length,
  };
}

/** Queues an outbound transfer for a record: the partner system is not built. */
export function queueOutboundTransfer(
  db: MockDatabase,
  actor: ViewerScope,
  args: { entityTable: string; entityId: Id; externalSystemName: string; payloadSummary: string },
): MockDatabase {
  const withTransfer = insertRow(db, "integrationTransfers", {
    _id: makeId("transfer"),
    entityTable: args.entityTable,
    entityId: args.entityId,
    direction: "outbound",
    externalSystemName: args.externalSystemName,
    status: "pending",
    attemptCount: 0,
    payloadSummary: args.payloadSummary,
    createdAt: currentTime(),
  });

  return appendAudit(withTransfer, {
    entityTable: args.entityTable,
    entityId: args.entityId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Queued an outbound transfer to ${args.externalSystemName}.`,
  });
}
