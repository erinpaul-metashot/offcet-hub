/** Maker views — allocations to respond to, production to run, evidence to submit. */

import { auditForEntity } from "./audit";
import { round } from "./ledger";
import { checkMaterialBalance } from "./transitions";
import type { Allocation, Id, Match, MockDatabase, ProductionBatch, ResourceRequest } from "./types";
import { costsForViewer, type ViewerScope } from "./visibility";
import { evidenceFor, findFacility, orgName, transfersFor } from "./selectors-shared";

export interface MakerAllocation {
  allocation: Allocation;
  batchName: string;
  batchReference: string;
  fromName: string;
  hasFeedback: boolean;
  production?: ProductionBatch;
}

export function listMakerAllocations(db: MockDatabase, orgId: Id): MakerAllocation[] {
  return db.allocations
    .filter((allocation) => allocation.toOrgId === orgId)
    .map((allocation) => {
      const batch = db.resourceBatches.find((entry) => entry._id === allocation.batchId);

      return {
        allocation,
        batchName: batch?.name ?? "Resource batch",
        batchReference: batch?.reference ?? "—",
        fromName: orgName(db, allocation.fromOrgId),
        hasFeedback: db.suitabilityFeedback.some(
          (entry) => entry.allocationId === allocation._id,
        ),
        production: db.productionBatches.find(
          (entry) => entry.allocationId === allocation._id,
        ),
      };
    })
    .sort((left, right) => right.allocation.updatedAt - left.allocation.updatedAt);
}

export interface MakerRequestRow {
  request: ResourceRequest;
  matches: Match[];
}

export function listMakerRequests(db: MockDatabase, orgId: Id): MakerRequestRow[] {
  return db.resourceRequests
    .filter((request) => request.requesterOrgId === orgId)
    .sort((left, right) => right.createdAt - left.createdAt)
    .map((request) => ({
      request,
      matches: db.matches.filter((match) => match.requestId === request._id),
    }));
}

export function listMakerProduction(db: MockDatabase, orgId: Id) {
  return db.productionBatches
    .filter((production) => production.makerOrgId === orgId && !production.deletedAt)
    .map((production) => ({
      production,
      batch: db.resourceBatches.find((entry) => entry._id === production.batchId),
      outputs: db.productionOutputs.filter(
        (output) => output.productionBatchId === production._id,
      ),
      overdue:
        production.plannedCompletionDate !== undefined &&
        production.plannedCompletionDate < Date.now() &&
        !production.actualCompletionDate,
    }))
    .sort((left, right) => right.production.updatedAt - left.production.updatedAt);
}

export function getProductionDetail(db: MockDatabase, viewer: ViewerScope, productionId: Id) {
  const production = db.productionBatches.find((entry) => entry._id === productionId);

  if (!production) {
    return null;
  }

  const allocation = db.allocations.find((entry) => entry._id === production.allocationId);
  const batch = db.resourceBatches.find((entry) => entry._id === production.batchId);
  const costs = costsForViewer(
    db.productionCosts.find((entry) => entry.productionBatchId === productionId),
    viewer,
  );

  const outputs = db.productionOutputs.filter(
    (output) => output.productionBatchId === productionId,
  );

  return {
    production,
    allocation,
    batch,
    project: db.projects.find((entry) => entry._id === production.projectId),
    makerName: orgName(db, production.makerOrgId),
    facility: findFacility(db, production.productionFacilityId),
    inputs: db.productionInputs.filter((input) => input.productionBatchId === productionId),
    timeEntries: db.productionTimeEntries.filter(
      (entry) => entry.productionBatchId === productionId,
    ),
    outputs,
    completedUnits: outputs.reduce((total, output) => total + (output.numberCompleted ?? 0), 0),
    rejectedUnits: outputs.reduce((total, output) => total + (output.numberRejected ?? 0), 0),
    reworkUnits: outputs.reduce(
      (total, output) => total + (output.numberRequiringRework ?? 0),
      0,
    ),
    costs,
    suitability: db.suitabilityFeedback.find(
      (entry) => entry.allocationId === production.allocationId,
    ),
    evidence: evidenceFor(db, "productionBatches", productionId),
    transfers: transfersFor(db, "productionBatches", productionId),
    audit: auditForEntity(db, "productionBatches", productionId),
    balance: checkMaterialBalance(production),
  };
}

export type ProductionDetail = NonNullable<ReturnType<typeof getProductionDetail>>;

export function getMakerDashboard(db: MockDatabase, viewer: ViewerScope) {
  const allocations = listMakerAllocations(db, viewer.orgId);
  const production = listMakerProduction(db, viewer.orgId);
  const requests = db.resourceRequests.filter(
    (request) => request.requesterOrgId === viewer.orgId,
  );

  const held = round(
    db.resourceBatches.reduce((total, batch) => {
      const mine = db.allocations.some(
        (allocation) =>
          allocation.batchId === batch._id &&
          allocation.toOrgId === viewer.orgId &&
          allocation.status === "received",
      );

      return mine ? total + batch.pots.with_maker : total;
    }, 0),
  );

  const transformed = round(
    production.reduce((total, entry) => total + (entry.production.qtyIncorporated ?? 0), 0),
  );
  const unitsMade = production.reduce(
    (total, entry) => total + (entry.production.actualQuantity ?? 0),
    0,
  );
  const hours = round(
    production.reduce((total, entry) => total + (entry.production.totalLabourHours ?? 0), 0),
  );

  return {
    metrics: {
      awaitingResponse: allocations.filter((entry) => entry.allocation.status === "proposed").length,
      inTransit: allocations.filter((entry) => entry.allocation.status === "in_transit").length,
      held,
      activeProduction: production.filter((entry) =>
        ["planned", "awaiting_material", "material_received", "in_production", "quality_review"].includes(
          entry.production.status,
        ),
      ).length,
      awaitingReview: production.filter(
        (entry) => entry.production.status === "evidence_submitted",
      ).length,
      overdue: production.filter((entry) => entry.overdue).length,
      transformed,
      unitsMade,
      hours,
      openRequests: requests.filter((request) =>
        ["submitted", "under_review", "partially_matched", "matched", "in_delivery"].includes(
          request.status,
        ),
      ).length,
    },
    allocations,
    production,
    requests,
    feedbackDue: allocations.filter(
      (entry) =>
        ["received", "completed"].includes(entry.allocation.status) && !entry.hasFeedback,
    ),
  };
}
