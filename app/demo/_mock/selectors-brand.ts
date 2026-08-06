/**
 * The brand and funder proof view (05_SYSTEM_DESIGN §10): one page telling one
 * story: brief, resource, activation, journey, outputs, results, evidence.
 *
 * These selectors deliberately never join to `productionCosts`. The only figure
 * that can cross is `baseCostPerUnit`, and only when the maker has opted in.
 */

import { round } from "./ledger";
import { materialYield } from "./transitions";
import type { Id, Match, MockDatabase, Project, ResourceBatch, ResourceRequest } from "./types";
import { sharedCostPerUnit, stripBatch, type ViewerScope } from "./visibility";
import { buildJourney, daysBetween, orgName } from "./selectors-shared";
import { now as currentTime } from "./clock";

export type { JourneyRow } from "./selectors-shared";

export function listBrandProjects(db: MockDatabase, orgId: Id): Project[] {
  return db.projects
    .filter((project) => project.brandOrgId === orgId && !project.deletedAt)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function getProjectProofView(db: MockDatabase, viewer: ViewerScope, projectId: Id) {
  const project = db.projects.find((entry) => entry._id === projectId);

  if (!project) {
    return null;
  }

  const requests = db.resourceRequests.filter((request) => request.projectId === projectId);
  const requestIds = new Set(requests.map((request) => request._id));

  const matches = db.matches.filter((match) => requestIds.has(match.requestId));
  const allocations = db.allocations.filter(
    (allocation) =>
      allocation.projectId === projectId ||
      (allocation.requestId !== undefined && requestIds.has(allocation.requestId)),
  );

  const batchIds = Array.from(new Set(allocations.map((allocation) => allocation.batchId)));
  const batches = db.resourceBatches
    .filter((batch) => batchIds.includes(batch._id))
    .map((batch) => stripBatch(batch, viewer));

  const allocationIds = new Set(allocations.map((allocation) => allocation._id));
  const production = db.productionBatches.filter((entry) => allocationIds.has(entry.allocationId));
  const productionIds = new Set(production.map((entry) => entry._id));

  const outputs = db.productionOutputs.filter((output) =>
    productionIds.has(output.productionBatchId),
  );

  const evidence = db.evidenceItems.filter(
    (item) =>
      !item.deletedAt &&
      ["brand", "project_participants", "public"].includes(item.visibility) &&
      ((item.entityTable === "productionBatches" && productionIds.has(item.entityId)) ||
        (item.entityTable === "allocations" && allocationIds.has(item.entityId)) ||
        (item.entityTable === "resourceBatches" && batchIds.includes(item.entityId))),
  );

  const journey = buildJourney(db, projectId);

  /* --- Material accounting, from the ledger rather than a claim --- */
  const activated = round(
    allocations
      .filter((allocation) => allocation.hop === "manufacturer_to_custodian")
      .reduce((total, allocation) => total + allocation.quantityAllocated, 0),
  );
  const received = round(
    allocations.reduce((total, allocation) => total + (allocation.quantityReceived ?? 0), 0),
  );
  const used = round(production.reduce((total, entry) => total + (entry.qtyUsed ?? 0), 0));
  const incorporated = round(
    production.reduce((total, entry) => total + (entry.qtyIncorporated ?? 0), 0),
  );
  const prototypes = round(production.reduce((total, entry) => total + (entry.qtyPrototypes ?? 0), 0));
  const offcuts = round(production.reduce((total, entry) => total + (entry.qtyOffcuts ?? 0), 0));
  const loss = round(production.reduce((total, entry) => total + (entry.qtyLoss ?? 0), 0));
  const remaining = round(
    production.reduce(
      (total, entry) => total + (entry.qtyReusableRemaining ?? 0) + (entry.qtyReturned ?? 0),
      0,
    ),
  );
  const writtenOffInTransit = round(
    allocations.reduce(
      (total, allocation) =>
        allocation.discrepancyResolution === "loss_confirmed"
          ? total + (allocation.quantityDiscrepancy ?? 0)
          : total,
      0,
    ),
  );

  /* --- Operational value --- */
  const firstRequest = requests.sort(
    (left, right) => (left.submittedAt ?? left.createdAt) - (right.submittedAt ?? right.createdAt),
  )[0];
  const firstMatch = matches.sort((left, right) => left.proposedAt - right.proposedAt)[0];

  const demandToMatchDays =
    firstRequest && firstMatch
      ? daysBetween(firstRequest.submittedAt ?? firstRequest.createdAt, firstMatch.proposedAt)
      : undefined;

  const firstProduction = production.sort(
    (left, right) => (left.actualStartDate ?? 0) - (right.actualStartDate ?? 0),
  )[0];

  const allocationToProductionDays =
    firstMatch && firstProduction?.actualStartDate
      ? daysBetween(firstMatch.proposedAt, firstProduction.actualStartDate)
      : undefined;

  const dispatched = round(
    allocations.reduce((total, allocation) => total + (allocation.quantityDispatched ?? 0), 0),
  );
  const deliveryAccuracy = dispatched > 0 ? round(received / dispatched) : undefined;

  const completedProduction = production.filter((entry) =>
    ["completed", "evidence_submitted", "cirka_reviewed"].includes(entry.status),
  );
  const completionRate =
    production.length > 0 ? round(completedProduction.length / production.length) : undefined;

  const issues = db.actionItems.filter(
    (item) =>
      (item.entityTable === "allocations" && allocationIds.has(item.entityId)) ||
      (item.entityTable === "productionBatches" && productionIds.has(item.entityId)),
  );

  /* --- Social and economic value --- */
  const makerOrgIds = new Set(production.map((entry) => entry.makerOrgId));
  const participantOrgIds = new Set<Id>([
    project.brandOrgId,
    ...allocations.flatMap((allocation) => [allocation.fromOrgId, allocation.toOrgId]),
    ...makerOrgIds,
  ]);

  const productionHours = round(
    production.reduce((total, entry) => total + (entry.totalLabourHours ?? 0), 0),
  );
  const unitsCompleted = outputs.reduce(
    (total, output) => total + (output.numberCompleted ?? 0),
    0,
  );
  const unitsPlanned = outputs.reduce((total, output) => total + output.numberPlanned, 0);

  /* Commercial learning: only what the maker has explicitly opted into. */
  const sharedCosts = production
    .map((entry) => {
      const cost = db.productionCosts.find((row) => row.productionBatchId === entry._id);
      const perUnit = sharedCostPerUnit(cost);

      return perUnit === undefined
        ? null
        : {
            productionReference: entry.reference,
            makerName: orgName(db, entry.makerOrgId),
            baseCostPerUnit: perUnit,
            currency: cost?.currency ?? "SEK",
          };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return {
    project,
    brandName: orgName(db, project.brandOrgId),
    requests,
    matches: matches.map((match) => ({
      match,
      batch: batches.find((batch) => batch._id === match.batchId),
      proposedBy: "CIRKA",
    })),
    batches,
    allocations: allocations.map((allocation) => ({
      allocation,
      fromName: orgName(db, allocation.fromOrgId),
      toName: orgName(db, allocation.toOrgId),
    })),
    production: production.map((entry) => ({
      production: entry,
      makerName: orgName(db, entry.makerOrgId),
      outputs: outputs.filter((output) => output.productionBatchId === entry._id),
      yield: materialYield(entry),
    })),
    outputs,
    evidence,
    journey,
    material: {
      activated,
      received,
      used,
      incorporated,
      prototypes,
      offcuts,
      loss,
      remaining,
      writtenOffInTransit,
      yield: used > 0 ? round(incorporated / used) : undefined,
      unit: batches[0]?.unit ?? "kg",
    },
    operational: {
      demandToMatchDays,
      allocationToProductionDays,
      deliveryAccuracy,
      completionRate,
      issuesRaised: issues.length,
      issuesResolved: issues.filter((item) => item.status !== "open").length,
      matchSuccess:
        matches.length > 0
          ? round(matches.filter((match) => match.status === "approved").length / matches.length)
          : undefined,
    },
    social: {
      makersEngaged: makerOrgIds.size,
      organisationsParticipating: participantOrgIds.size,
      productionHours,
      unitsCompleted,
      unitsPlanned,
    },
    commercial: {
      sharedCosts,
      hoursPerUnit:
        unitsCompleted > 0 && productionHours > 0
          ? round(productionHours / unitsCompleted)
          : undefined,
    },
    assurance: {
      reviewed: production.filter((entry) => entry.evidenceStatus === "cirka_reviewed").length,
      selfReported: production.filter((entry) => entry.evidenceStatus !== "cirka_reviewed").length,
      dataSources: Array.from(new Set(batches.map((batch) => batch.dataSource))),
      externalRecords: db.integrationTransfers.filter(
        (transfer) =>
          transfer.status === "success" &&
          transfer.direction === "outbound" &&
          productionIds.has(transfer.entityId),
      ),
    },
  };
}

export type ProjectProofView = NonNullable<ReturnType<typeof getProjectProofView>>;

export function getBrandDashboard(db: MockDatabase, viewer: ViewerScope) {
  const projects = listBrandProjects(db, viewer.orgId);
  const requests = db.resourceRequests.filter(
    (request) => request.requesterOrgId === viewer.orgId,
  );

  const proofViews = projects
    .map((project) => getProjectProofView(db, viewer, project._id))
    .filter((view): view is ProjectProofView => view !== null);

  const activated = round(
    proofViews.reduce((total, view) => total + view.material.activated, 0),
  );
  const incorporated = round(
    proofViews.reduce((total, view) => total + view.material.incorporated, 0),
  );
  const unitsCompleted = proofViews.reduce(
    (total, view) => total + view.social.unitsCompleted,
    0,
  );

  const pendingApprovals = db.matches
    .filter((match) => match.status === "proposed")
    .map((match) => ({
      match,
      request: db.resourceRequests.find((request) => request._id === match.requestId),
      batch: db.resourceBatches.find((batch) => batch._id === match.batchId),
      waitingDays: daysBetween(match.proposedAt, currentTime()),
    }))
    .filter((entry) => entry.request?.requesterOrgId === viewer.orgId);

  return {
    projects,
    proofViews,
    requests,
    pendingApprovals,
    metrics: {
      activeProjects: projects.filter((project) => project.status === "active").length,
      activated,
      incorporated,
      unitsCompleted,
      makersEngaged: new Set(
        proofViews.flatMap((view) => view.production.map((entry) => entry.production.makerOrgId)),
      ).size,
      pendingApprovals: pendingApprovals.length,
      openRequests: requests.filter((request) =>
        ["submitted", "under_review", "partially_matched", "matched", "in_delivery"].includes(
          request.status,
        ),
      ).length,
    },
  };
}

export interface PendingApprovalDetail {
  match: Match;
  request?: ResourceRequest;
  batch?: ResourceBatch;
  project?: Project;
}

/** A single proposed match, scoped to the brand whose request it was proposed against. */
export function getPendingApprovalDetail(
  db: MockDatabase,
  viewer: ViewerScope,
  matchId: Id,
): PendingApprovalDetail | null {
  const match = db.matches.find((entry) => entry._id === matchId);

  if (!match) {
    return null;
  }

  const request = db.resourceRequests.find((entry) => entry._id === match.requestId);

  if (!request || request.requesterOrgId !== viewer.orgId) {
    return null;
  }

  return {
    match,
    request,
    batch: db.resourceBatches.find((entry) => entry._id === match.batchId),
    project: request.projectId
      ? db.projects.find((entry) => entry._id === request.projectId)
      : undefined,
  };
}
