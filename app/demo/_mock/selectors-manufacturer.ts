/** Manufacturer views: what I have recorded, what I owe, what went wrong. */

import { buildMonthBuckets } from "./buckets";
import { round } from "./ledger";
import type { Id, MockDatabase } from "./types";
import type { ViewerScope } from "./visibility";
import { listBatches } from "./selectors-batches";
import {
  allocationsForOrg,
  batchesForOrg,
  formatQuantity,
  orgName,
  topCategories,
} from "./selectors-shared";

export function listDispatchQueue(db: MockDatabase, orgId: Id) {
  return db.allocations
    .filter(
      (allocation) =>
        allocation.fromOrgId === orgId &&
        ["proposed", "accepted", "awaiting_dispatch", "in_transit"].includes(allocation.status),
    )
    .map((allocation) => ({
      allocation,
      batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
      toName: orgName(db, allocation.toOrgId),
    }))
    .sort((left, right) => {
      const leftDate = left.allocation.expectedDispatchDate ?? left.allocation.createdAt;
      const rightDate = right.allocation.expectedDispatchDate ?? right.allocation.createdAt;
      return leftDate - rightDate;
    });
}

export function listOpenDiscrepancies(db: MockDatabase, orgId: Id) {
  return db.allocations
    .filter(
      (allocation) =>
        allocation.status === "discrepancy" &&
        (allocation.fromOrgId === orgId || allocation.toOrgId === orgId),
    )
    .map((allocation) => ({
      allocation,
      batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
      counterpartyName: orgName(
        db,
        allocation.fromOrgId === orgId ? allocation.toOrgId : allocation.fromOrgId,
      ),
    }));
}

export function getManufacturerDashboard(db: MockDatabase, viewer: ViewerScope) {
  const batches = batchesForOrg(db, viewer.orgId);
  const rows = listBatches(db, viewer, { ownerOrgId: viewer.orgId });

  const recorded = round(batches.reduce((total, batch) => total + batch.quantityOriginal, 0));
  const available = round(batches.reduce((total, batch) => total + batch.pots.available, 0));
  const committed = round(
    batches.reduce(
      (total, batch) =>
        total +
        batch.pots.reserved +
        batch.pots.allocated +
        batch.pots.in_transit +
        batch.pots.at_custodian +
        batch.pots.with_maker,
      0,
    ),
  );
  const transformed = round(batches.reduce((total, batch) => total + batch.pots.consumed, 0));

  const awaitingRelease = batches.filter((batch) => !batch.releasedAt);
  const dispatchQueue = listDispatchQueue(db, viewer.orgId);
  const discrepancies = listOpenDiscrepancies(db, viewer.orgId);
  const allocations = allocationsForOrg(db, viewer.orgId);

  return {
    metrics: {
      batchCount: batches.length,
      recorded,
      available,
      committed,
      transformed,
      awaitingRelease: awaitingRelease.length,
      awaitingDispatch: dispatchQueue.filter((entry) =>
        ["accepted", "awaiting_dispatch"].includes(entry.allocation.status),
      ).length,
      openDiscrepancies: discrepancies.length,
    },
    unit: batches[0]?.unit ?? "kg",
    trend: buildMonthBuckets(batches.map((batch) => batch.createdAt)),
    categories: topCategories(batches),
    recentBatches: rows.slice(0, 6),
    awaitingRelease,
    dispatchQueue,
    discrepancies,
    allocationCount: allocations.length,
    activatedLabel: formatQuantity(transformed, batches[0]?.unit ?? "kg"),
  };
}
