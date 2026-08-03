/**
 * Assembles the seed database.
 *
 * Batches are seeded empty and their history is replayed through
 * `applyMovement`, so the starting state is produced by the same engine the UI
 * uses. If a seed script were inconsistent, the database would refuse to build.
 */

import { appendAudit } from "./audit";
import { applyMovement } from "./ledger";
import { resetIdCounter } from "./ids";
import type { MockDatabase } from "./types";
import { allocations } from "./data/allocations";
import { batchSeeds } from "./data/batches";
import { matches, projectMilestones, projects, resourceRequests } from "./data/demand";
import { facilities, organisations, users } from "./data/orgs";
import {
  actionItems,
  evidenceItems,
  importJobs,
  integrationTransfers,
  pendingArrivals,
  seedAuditEntries,
} from "./data/plumbing";
import {
  productionBatches,
  productionCosts,
  productionInputs,
  productionOutputs,
  productionTimeEntries,
  suitabilityFeedback,
} from "./data/production";

export {
  DEMO_ADMIN_ID,
  DEMO_BRAND_ID,
  DEMO_CUSTODIAN_ID,
  DEMO_MAKER_ID,
  DEMO_MANUFACTURER_ID,
  ORG_BYTHORN,
  ORG_CIRKA,
  ORG_MALMO_NODE,
  ORG_NORDVAST,
  ORG_RASK,
} from "./data/orgs";
export { DEMO_NOW } from "./data/time";
export { PROJECT_JERSEY } from "./data/demand";
export { BATCH_JERSEY } from "./data/batches";

function clone<T>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

/** A fresh copy of the seed database — never hand out the module-level arrays. */
export function createMockDatabase(): MockDatabase {
  resetIdCounter();

  const base: MockDatabase = {
    organisations: clone(organisations),
    users: clone(users),
    facilities: clone(facilities),
    resourceBatches: batchSeeds.map((seed) => ({ ...seed.batch, pots: { ...seed.batch.pots } })),
    quantityMovements: [],
    projects: clone(projects),
    resourceRequests: clone(resourceRequests),
    matches: clone(matches),
    allocations: clone(allocations),
    productionBatches: clone(productionBatches),
    productionInputs: clone(productionInputs),
    productionTimeEntries: clone(productionTimeEntries),
    productionOutputs: clone(productionOutputs),
    productionCosts: clone(productionCosts),
    suitabilityFeedback: clone(suitabilityFeedback),
    auditLog: clone(seedAuditEntries),
    evidenceItems: clone(evidenceItems),
    importJobs: clone(importJobs),
    integrationTransfers: clone(integrationTransfers),
    projectMilestones: clone(projectMilestones),
    actionItems: clone(actionItems),
    pendingArrivals: clone(pendingArrivals),
  };

  const replayed = batchSeeds.reduce((db, seed) => {
    return seed.movements.reduce((current, movement) => {
      const next = applyMovement(current, { ...movement, batchId: seed.batch._id });

      return appendAudit(next, {
        entityTable: "resourceBatches",
        entityId: seed.batch._id,
        action: movement.reason === "initial_record" ? "created" : "quantity_moved",
        actorUserId: movement.performedByUserId,
        actorOrgId: movement.performedByOrgId,
        actorType: movement.performedByUserId ? "user" : "import",
        occurredAt: movement.occurredAt,
        notes: movement.notes,
        fieldChanges: [
          {
            field: movement.reason,
            previousValue: movement.fromBucket ?? undefined,
            newValue: movement.toBucket ?? undefined,
          },
        ],
      });
    }, db);
  }, base);

  /* The seeded status on each batch is a placeholder; the replay derives the real one. */
  return replayed;
}
