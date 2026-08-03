/**
 * Custodian views — expected arrivals, what is physically here, and what has
 * been promised on to makers.
 *
 * Ownership and custody are separate: a custodian holding 300 kg does not own
 * it, so holdings are derived from the allocations that ended at this site.
 */

import { round } from "./ledger";
import type { Allocation, Id, MockDatabase, ResourceBatch } from "./types";
import type { ViewerScope } from "./visibility";
import { orgName } from "./selectors-shared";

export interface ExpectedArrival {
  allocation: Allocation;
  batch?: ResourceBatch;
  fromName: string;
  late: boolean;
}

export function listExpectedArrivals(db: MockDatabase, orgId: Id): ExpectedArrival[] {
  return db.allocations
    .filter(
      (allocation) =>
        allocation.toOrgId === orgId &&
        ["proposed", "accepted", "awaiting_dispatch", "in_transit", "discrepancy"].includes(
          allocation.status,
        ),
    )
    .map((allocation) => ({
      allocation,
      batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
      fromName: orgName(db, allocation.fromOrgId),
      late:
        allocation.expectedArrivalDate !== undefined &&
        allocation.expectedArrivalDate < Date.now() &&
        allocation.status !== "received",
    }))
    .sort((left, right) => {
      const leftDate = left.allocation.expectedArrivalDate ?? left.allocation.createdAt;
      const rightDate = right.allocation.expectedArrivalDate ?? right.allocation.createdAt;
      return leftDate - rightDate;
    });
}

export interface Holding {
  batch: ResourceBatch;
  held: number;
  promised: number;
  uncommitted: number;
  ownerName: string;
  receivedAt?: number;
  sourceAllocation?: Allocation;
}

/** Batches physically at this custodian's site, with what is still uncommitted. */
export function listHoldings(db: MockDatabase, orgId: Id): Holding[] {
  const receivedHere = db.allocations.filter(
    (allocation) =>
      allocation.toOrgId === orgId &&
      allocation.hop === "manufacturer_to_custodian" &&
      ["received", "discrepancy", "completed"].includes(allocation.status),
  );

  const batchIds = Array.from(new Set(receivedHere.map((allocation) => allocation.batchId)));

  const holdings: Holding[] = [];

  for (const batchId of batchIds) {
    const batch = db.resourceBatches.find((entry) => entry._id === batchId);

    if (!batch || batch.pots.at_custodian <= 0) {
      continue;
    }

    const promised = round(
      db.allocations
        .filter(
          (allocation) =>
            allocation.batchId === batchId &&
            allocation.fromOrgId === orgId &&
            allocation.hop === "custodian_to_maker" &&
            ["proposed", "accepted", "awaiting_dispatch"].includes(allocation.status),
        )
        .reduce((total, allocation) => total + allocation.quantityAllocated, 0),
    );

    const sourceAllocation = receivedHere.find((allocation) => allocation.batchId === batchId);

    holdings.push({
      batch,
      held: round(batch.pots.at_custodian),
      promised,
      uncommitted: round(batch.pots.at_custodian - promised),
      ownerName: orgName(db, batch.ownerOrgId),
      receivedAt: sourceAllocation?.receivedAt,
      sourceAllocation,
    });
  }

  return holdings.sort((left, right) => right.held - left.held);
}

export function listOutgoingToMakers(db: MockDatabase, orgId: Id) {
  return db.allocations
    .filter((allocation) => allocation.fromOrgId === orgId && allocation.hop === "custodian_to_maker")
    .map((allocation) => ({
      allocation,
      batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
      makerName: orgName(db, allocation.toOrgId),
    }))
    .sort((left, right) => right.allocation.updatedAt - left.allocation.updatedAt);
}

export function getCustodianDashboard(db: MockDatabase, viewer: ViewerScope) {
  const arrivals = listExpectedArrivals(db, viewer.orgId);
  const holdings = listHoldings(db, viewer.orgId);
  const outgoing = listOutgoingToMakers(db, viewer.orgId);

  const totalHeld = round(holdings.reduce((total, holding) => total + holding.held, 0));
  const uncommitted = round(holdings.reduce((total, holding) => total + holding.uncommitted, 0));
  const inTransit = round(
    arrivals
      .filter((entry) => entry.allocation.status === "in_transit")
      .reduce(
        (total, entry) =>
          total + (entry.allocation.quantityDispatched ?? entry.allocation.quantityAllocated),
        0,
      ),
  );

  return {
    metrics: {
      totalHeld,
      uncommitted,
      inTransit,
      awaitingReceipt: arrivals.filter((entry) => entry.allocation.status === "in_transit").length,
      awaitingAcceptance: arrivals.filter((entry) => entry.allocation.status === "proposed").length,
      openDiscrepancies: arrivals.filter((entry) => entry.allocation.status === "discrepancy").length,
      makersServed: new Set(outgoing.map((entry) => entry.allocation.toOrgId)).size,
      overdue: arrivals.filter((entry) => entry.late).length,
    },
    arrivals,
    holdings,
    outgoing,
    pendingMakerResponses: outgoing.filter((entry) =>
      ["proposed", "accepted", "awaiting_dispatch", "in_transit"].includes(entry.allocation.status),
    ),
  };
}
