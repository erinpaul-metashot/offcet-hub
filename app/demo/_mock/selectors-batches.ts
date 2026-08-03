/** Resource batch views — list rows, the detail page, and the pot breakdown. */

import { BUCKET_LABELS, QUANTITY_BUCKETS, type QuantityBucket } from "./domain";
import { auditForEntity } from "./audit";
import { round } from "./ledger";
import type { Id, MockDatabase, ResourceBatch } from "./types";
import { stripBatch, type ViewerScope } from "./visibility";
import {
  allocationsForBatch,
  evidenceFor,
  findFacility,
  findOrganisation,
  movementsForBatch,
  orgName,
  productionForBatch,
  transfersFor,
} from "./selectors-shared";

export interface PotSlice {
  bucket: QuantityBucket;
  label: string;
  quantity: number;
  share: number;
  terminal: boolean;
}

/** The stacked pot view used by the quantity bar and the batch tables. */
export function potSlices(batch: ResourceBatch): PotSlice[] {
  const total = batch.quantityOriginal || 1;

  return QUANTITY_BUCKETS.filter((bucket) => batch.pots[bucket] > 0).map((bucket) => ({
    bucket,
    label: BUCKET_LABELS[bucket],
    quantity: round(batch.pots[bucket]),
    share: round(batch.pots[bucket] / total),
    terminal: bucket === "consumed" || bucket === "written_off",
  }));
}

/** The same stacked pot view, summed across every batch — the network-wide ledger. */
export function aggregatePotSlices(batches: ResourceBatch[]): PotSlice[] {
  const total = batches.reduce((sum, batch) => sum + batch.quantityOriginal, 0) || 1;

  const totals = QUANTITY_BUCKETS.reduce<Record<QuantityBucket, number>>(
    (sums, bucket) => ({
      ...sums,
      [bucket]: batches.reduce((sum, batch) => sum + batch.pots[bucket], 0),
    }),
    {} as Record<QuantityBucket, number>,
  );

  return QUANTITY_BUCKETS.filter((bucket) => totals[bucket] > 0).map((bucket) => ({
    bucket,
    label: BUCKET_LABELS[bucket],
    quantity: round(totals[bucket]),
    share: round(totals[bucket] / total),
    terminal: bucket === "consumed" || bucket === "written_off",
  }));
}

export interface BatchRow {
  batch: ResourceBatch;
  ownerName: string;
  facilityName?: string;
  slices: PotSlice[];
  committed: number;
  hasException: boolean;
}

export function toBatchRow(db: MockDatabase, batch: ResourceBatch): BatchRow {
  return {
    batch,
    ownerName: orgName(db, batch.ownerOrgId),
    facilityName: findFacility(db, batch.sourceFacilityId)?.name,
    slices: potSlices(batch),
    committed: round(batch.quantityOriginal - batch.pots.available),
    hasException: Boolean(batch.exceptionStatus),
  };
}

export function listBatches(
  db: MockDatabase,
  viewer: ViewerScope,
  filters: { ownerOrgId?: Id; status?: string; category?: string; search?: string } = {},
): BatchRow[] {
  return db.resourceBatches
    .filter((batch) => !batch.deletedAt)
    .filter((batch) => (filters.ownerOrgId ? batch.ownerOrgId === filters.ownerOrgId : true))
    .filter((batch) => (filters.status ? batch.status === filters.status : true))
    .filter((batch) => (filters.category ? batch.materialCategory === filters.category : true))
    .filter((batch) => {
      if (!filters.search) {
        return true;
      }

      const needle = filters.search.toLowerCase();
      return (
        batch.name.toLowerCase().includes(needle) ||
        batch.reference.toLowerCase().includes(needle) ||
        (batch.locationText ?? "").toLowerCase().includes(needle)
      );
    })
    .map((batch) => toBatchRow(db, stripBatch(batch, viewer)))
    .sort((left, right) => right.batch.createdAt - left.batch.createdAt);
}

/** Batches with uncommitted quantity, ready for an admin to match against. */
export function listMatchableBatches(db: MockDatabase, viewer: ViewerScope): BatchRow[] {
  return db.resourceBatches
    .filter((batch) => !batch.deletedAt && batch.releasedAt && batch.pots.available > 0)
    .map((batch) => toBatchRow(db, stripBatch(batch, viewer)))
    .sort((left, right) => right.batch.pots.available - left.batch.pots.available);
}

export function getBatchDetail(db: MockDatabase, viewer: ViewerScope, batchId: Id) {
  const found = db.resourceBatches.find((entry) => entry._id === batchId);

  if (!found) {
    return null;
  }

  const batch = stripBatch(found, viewer);
  const allocations = allocationsForBatch(db, batchId).map((allocation) => ({
    allocation,
    fromName: orgName(db, allocation.fromOrgId),
    toName: orgName(db, allocation.toOrgId),
  }));

  const matches = db.matches
    .filter((match) => match.batchId === batchId)
    .map((match) => ({
      match,
      request: db.resourceRequests.find((request) => request._id === match.requestId),
    }))
    .sort((left, right) => right.match.proposedAt - left.match.proposedAt);

  return {
    batch,
    ownerName: orgName(db, batch.ownerOrgId),
    owner: findOrganisation(db, batch.ownerOrgId),
    facility: findFacility(db, batch.sourceFacilityId),
    slices: potSlices(batch),
    movements: movementsForBatch(db, batchId),
    allocations,
    matches,
    production: productionForBatch(db, batchId),
    evidence: evidenceFor(db, "resourceBatches", batchId),
    transfers: transfersFor(db, "resourceBatches", batchId),
    audit: auditForEntity(db, "resourceBatches", batchId),
    importJob: db.importJobs.find((job) => job._id === batch.importJobId),
  };
}

export type BatchDetail = NonNullable<ReturnType<typeof getBatchDetail>>;
