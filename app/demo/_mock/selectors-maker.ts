/** Maker views: allocations to respond to, production to run, evidence to submit. */

import { auditForEntity } from "./audit";
import type { Unit } from "./domain";
import { round } from "./ledger";
import { checkMaterialBalance } from "./transitions";
import type {
  Allocation,
  Id,
  Match,
  MockDatabase,
  ProductionBatch,
  ProductionOutput,
  Project,
  ResourceBatch,
  ResourceRequest,
} from "./types";
import { costsForViewer, type ViewerScope } from "./visibility";
import {
  buildJourney,
  evidenceFor,
  findFacility,
  orgName,
  transfersFor,
  type JourneyRow,
} from "./selectors-shared";
import { now as currentTime } from "./clock";

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
        batchReference: batch?.reference ?? "-",
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

export interface MakerProductionRow {
  production: ProductionBatch;
  batch?: ResourceBatch;
  outputs: ProductionOutput[];
  overdue: boolean;
}

export function listMakerProduction(db: MockDatabase, orgId: Id): MakerProductionRow[] {
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
        production.plannedCompletionDate < currentTime() &&
        !production.actualCompletionDate,
    }))
    .sort((left, right) => right.production.updatedAt - left.production.updatedAt);
}

/** Runs a maker took on without a brand brief behind them still have to be accounted for. */
export const UNASSIGNED_PROJECT = "unassigned";

export interface MakerProjectRow {
  key: Id;
  project?: Project;
  title: string;
  reference?: string;
  brandName?: string;
  runs: MakerProductionRow[];
  outputs: ProductionOutput[];
  material: {
    allocated: number;
    received: number;
    used: number;
    incorporated: number;
    prototypes: number;
    offcuts: number;
    loss: number;
    remaining: number;
    yield?: number;
    unit: Unit;
  };
  unitsCompleted: number;
  unitsPlanned: number;
  hours: number;
  activeRuns: number;
  reviewedRuns: number;
  lastActivity: number;
}

const ACTIVE_PRODUCTION = [
  "planned",
  "awaiting_material",
  "material_received",
  "in_production",
  "quality_review",
];

function summariseMakerProject(db: MockDatabase, key: Id, runs: MakerProductionRow[]): MakerProjectRow {
  const project = key === UNASSIGNED_PROJECT ? undefined : db.projects.find((entry) => entry._id === key);
  const outputs = runs.flatMap((row) => row.outputs);

  const total = (pick: (production: ProductionBatch) => number | undefined) =>
    round(runs.reduce((sum, row) => sum + (pick(row.production) ?? 0), 0));

  const used = total((production) => production.qtyUsed);
  const incorporated = total((production) => production.qtyIncorporated);

  return {
    key,
    project,
    title: project?.title ?? "Work without a brand brief",
    reference: project?.reference,
    brandName: project ? orgName(db, project.brandOrgId) : undefined,
    runs,
    outputs,
    material: {
      allocated: total((production) => production.qtyAllocated),
      received: total((production) => production.qtyReceived),
      used,
      incorporated,
      prototypes: total((production) => production.qtyPrototypes),
      offcuts: total((production) => production.qtyOffcuts),
      loss: total((production) => production.qtyLoss),
      remaining: round(
        total((production) => production.qtyReusableRemaining) +
          total((production) => production.qtyReturned),
      ),
      yield: used > 0 ? round(incorporated / used) : undefined,
      unit: runs[0]?.production.unit ?? "kg",
    },
    unitsCompleted: outputs.reduce((sum, output) => sum + (output.numberCompleted ?? 0), 0),
    unitsPlanned: outputs.reduce((sum, output) => sum + output.numberPlanned, 0),
    hours: round(
      runs.reduce((sum, row) => sum + (row.production.totalLabourHours ?? 0), 0),
    ),
    activeRuns: runs.filter((row) => ACTIVE_PRODUCTION.includes(row.production.status)).length,
    reviewedRuns: runs.filter((row) => row.production.evidenceStatus === "cirka_reviewed").length,
    lastActivity: Math.max(...runs.map((row) => row.production.updatedAt)),
  };
}

/**
 * The maker's own portfolio: their production runs grouped by the brief they
 * served. Scoped to their own runs only — a maker never sees what another maker
 * made on the same project (05_SYSTEM_DESIGN §6.1).
 */
export function listMakerProjects(db: MockDatabase, orgId: Id): MakerProjectRow[] {
  const groups = new Map<Id, MakerProductionRow[]>();

  for (const row of listMakerProduction(db, orgId)) {
    const allocation = db.allocations.find((entry) => entry._id === row.production.allocationId);
    const key = row.production.projectId ?? allocation?.projectId ?? UNASSIGNED_PROJECT;

    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.entries())
    .map(([key, runs]) => summariseMakerProject(db, key, runs))
    .sort((left, right) => right.lastActivity - left.lastActivity);
}

export interface MakerProjectDetail extends MakerProjectRow {
  project: Project;
  journey: JourneyRow[];
}

export function getMakerProjectDetail(
  db: MockDatabase,
  orgId: Id,
  projectId: Id,
): MakerProjectDetail | null {
  const row = listMakerProjects(db, orgId).find((entry) => entry.key === projectId);

  if (!row?.project) {
    return null;
  }

  return { ...row, project: row.project, journey: buildJourney(db, projectId) };
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
