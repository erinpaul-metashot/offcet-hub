/**
 * CIRKA before anything has happened.
 *
 * The organisations and their people are present but *pending*: five companies
 * have applied and nobody has been approved. Everything downstream — batches,
 * movements, projects, requests, matches, allocations, production, evidence,
 * the audit log — is empty, and every row the viewer sees from here on was
 * written by a beat they watched run.
 *
 * Accounts are kept rather than created because the demo signs you in as a
 * fixed persona per role; minting those ids mid-story would leave the role
 * switcher pointing at people who do not exist yet.
 */

import { facilities, organisations, users } from "../_mock/data/orgs";
import { resetIdCounter } from "../_mock/ids";
import type { MockDatabase } from "../_mock/types";

export function createEmptyDatabase(): MockDatabase {
  resetIdCounter();

  return {
    /* CIRKA runs the platform, so CIRKA is already approved. Everyone else is
       an application waiting on a decision. */
    organisations: organisations.map((org) => ({
      ...org,
      status: org.type === "cirka" ? "approved" : "pending",
    })),
    users: users.map((user) => ({
      ...user,
      status: user.role === "admin" ? "approved" : "pending",
    })),
    facilities: facilities.map((facility) => ({ ...facility })),

    resourceBatches: [],
    quantityMovements: [],
    projects: [],
    resourceRequests: [],
    matches: [],
    allocations: [],
    productionBatches: [],
    productionInputs: [],
    productionTimeEntries: [],
    productionOutputs: [],
    productionCosts: [],
    suitabilityFeedback: [],
    auditLog: [],
    evidenceItems: [],
    importJobs: [],
    integrationConnections: [],
    integrationTransfers: [],
    projectMilestones: [],
    actionItems: [],
    pendingArrivals: [],
  };
}
