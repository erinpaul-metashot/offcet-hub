/** Projects, demand requests and the recorded matching decision. */

import { appendAudit } from "../audit";
import type { MaterialCategory, Unit } from "../domain";
import { makeId, makeReference } from "../ids";
import { applyMovement } from "../ledger";
import { assertMatchTransition, assertRequestTransition } from "../transitions";
import type { Allocation, Id, Match, MockDatabase, Project, ResourceRequest } from "../types";
import type { ViewerScope } from "../visibility";
import {
  OperationError,
  insertRow,
  nextSequence,
  patchRow,
  requirePositive,
  requireRow,
  requireText,
} from "./helpers";

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

export interface ProjectInput {
  title: string;
  objective: string;
  intendedProduct?: string;
  designIntent?: string;
  commercialObjectives?: string;
  impactObjectives?: string;
  startDate?: number;
  targetCompletionDate?: number;
}

export function createProject(
  db: MockDatabase,
  actor: ViewerScope,
  input: ProjectInput,
): { db: MockDatabase; projectId: Id } {
  const title = requireText(input.title, "Give the project a title.");
  const objective = requireText(input.objective, "Describe what the project is trying to achieve.");
  const projectId = makeId("project");

  const project: Project = {
    _id: projectId,
    reference: makeReference(
      "PRJ",
      nextSequence(
        db.projects.map((entry) => entry.reference),
        "CIRKA-PRJ",
      ),
    ),
    brandOrgId: actor.orgId,
    ownerUserId: actor.userId,
    title,
    objective,
    intendedProduct: input.intendedProduct?.trim() || undefined,
    designIntent: input.designIntent?.trim() || undefined,
    commercialObjectives: input.commercialObjectives?.trim() || undefined,
    impactObjectives: input.impactObjectives?.trim() || undefined,
    startDate: input.startDate,
    targetCompletionDate: input.targetCompletionDate,
    status: "draft",
    visibility: "private",
    createdAt: Date.now(),
  };

  const withProject = insertRow(db, "projects", project);

  return {
    db: appendAudit(withProject, {
      entityTable: "projects",
      entityId: projectId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
    }),
    projectId,
  };
}

export function activateProject(
  db: MockDatabase,
  actor: ViewerScope,
  args: { projectId: Id },
): MockDatabase {
  const project = requireRow(db, "projects", args.projectId, "Project");

  if (project.status !== "draft") {
    throw new OperationError("Only a draft project can be activated.");
  }

  const updated = patchRow(db, "projects", args.projectId, {
    status: "active",
    visibility: "shared_with_participants",
    startDate: project.startDate ?? Date.now(),
    updatedAt: Date.now(),
  });

  return appendAudit(updated, {
    entityTable: "projects",
    entityId: args.projectId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: "draft", newValue: "active" }],
  });
}

/* ------------------------------------------------------------------ *
 * Demand requests
 * ------------------------------------------------------------------ */

export interface RequestInput {
  projectId?: Id;
  title: string;
  materialCategory: MaterialCategory;
  materialDescription?: string;
  compositionRequirements?: string;
  qualityRequirements?: string;
  formatPreference?: string;
  quantityNeeded: number;
  unit: Unit;
  intendedProduct?: string;
  neededBy?: number;
  productionLocationPreference?: string;
  maxDistanceKm?: number;
  submitImmediately?: boolean;
}

export function createResourceRequest(
  db: MockDatabase,
  actor: ViewerScope,
  input: RequestInput,
): { db: MockDatabase; requestId: Id } {
  const title = requireText(input.title, "Give the request a title.");
  const quantityNeeded = requirePositive(input.quantityNeeded, "Quantity must be greater than zero.");
  const requestId = makeId("request");
  const now = Date.now();

  const request: ResourceRequest = {
    _id: requestId,
    reference: makeReference(
      "REQ",
      nextSequence(
        db.resourceRequests.map((entry) => entry.reference),
        "CIRKA-REQ",
      ),
    ),
    projectId: input.projectId,
    requesterOrgId: actor.orgId,
    requesterUserId: actor.userId,
    title,
    materialCategory: input.materialCategory,
    materialDescription: input.materialDescription?.trim() || undefined,
    compositionRequirements: input.compositionRequirements?.trim() || undefined,
    qualityRequirements: input.qualityRequirements?.trim() || undefined,
    formatPreference: input.formatPreference?.trim() || undefined,
    quantityNeeded,
    unit: input.unit,
    quantityMatched: 0,
    intendedProduct: input.intendedProduct?.trim() || undefined,
    neededBy: input.neededBy,
    productionLocationPreference: input.productionLocationPreference?.trim() || undefined,
    maxDistanceKm: input.maxDistanceKm,
    status: input.submitImmediately ? "submitted" : "draft",
    attachmentNames: [],
    createdAt: now,
    submittedAt: input.submitImmediately ? now : undefined,
  };

  const withRequest = insertRow(db, "resourceRequests", request);

  return {
    db: appendAudit(withRequest, {
      entityTable: "resourceRequests",
      entityId: requestId,
      action: input.submitImmediately ? "submitted" : "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
    }),
    requestId,
  };
}

export function submitResourceRequest(
  db: MockDatabase,
  actor: ViewerScope,
  args: { requestId: Id },
): MockDatabase {
  const request = requireRow(db, "resourceRequests", args.requestId, "Request");
  assertRequestTransition(request.status, "submitted");

  const updated = patchRow(db, "resourceRequests", args.requestId, {
    status: "submitted",
    submittedAt: Date.now(),
  });

  return appendAudit(updated, {
    entityTable: "resourceRequests",
    entityId: args.requestId,
    action: "submitted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: request.status, newValue: "submitted" }],
  });
}

export function markRequestUnfulfillable(
  db: MockDatabase,
  actor: ViewerScope,
  args: { requestId: Id; note: string },
): MockDatabase {
  const request = requireRow(db, "resourceRequests", args.requestId, "Request");
  const note = requireText(args.note, "Say why nothing suitable is available.");
  assertRequestTransition(request.status, "unfulfillable");

  const updated = patchRow(db, "resourceRequests", args.requestId, { status: "unfulfillable" });

  return appendAudit(updated, {
    entityTable: "resourceRequests",
    entityId: args.requestId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: request.status, newValue: "unfulfillable" }],
    notes: note,
  });
}

/* ------------------------------------------------------------------ *
 * Matching — a recorded decision, not a calculation
 * ------------------------------------------------------------------ */

export interface ProposeMatchInput {
  requestId: Id;
  batchId: Id;
  quantityProposed: number;
  rationale: string;
  suggestedCustodianOrgId?: Id;
  suggestedMakerOrgId?: Id;
  categoryFitNote?: string;
  availabilityFitNote?: string;
  distanceKm?: number;
}

export function proposeMatch(
  db: MockDatabase,
  actor: ViewerScope,
  input: ProposeMatchInput,
): MockDatabase {
  const request = requireRow(db, "resourceRequests", input.requestId, "Request");
  const batch = requireRow(db, "resourceBatches", input.batchId, "Resource batch");
  const rationale = requireText(
    input.rationale,
    "A match needs a written rationale — the brand is shown this.",
  );
  const quantity = requirePositive(input.quantityProposed, "Quantity must be greater than zero.");

  if (!batch.releasedAt) {
    throw new OperationError("This batch has not been released for matching yet.");
  }

  const matchId = makeId("match");

  const match: Match = {
    _id: matchId,
    requestId: input.requestId,
    batchId: input.batchId,
    quantityProposed: quantity,
    unit: batch.unit,
    rationale,
    suggestedCustodianOrgId: input.suggestedCustodianOrgId,
    suggestedMakerOrgId: input.suggestedMakerOrgId,
    categoryFitNote: input.categoryFitNote?.trim() || undefined,
    availabilityFitNote: input.availabilityFitNote?.trim() || undefined,
    distanceKm: input.distanceKm,
    proposedByUserId: actor.userId,
    proposedAt: Date.now(),
    status: "proposed",
  };

  /* Reserving is what stops the same quantity being promised twice. */
  const reserved = applyMovement(insertRow(db, "matches", match), {
    batchId: input.batchId,
    fromBucket: "available",
    toBucket: "reserved",
    quantity,
    reason: "reserved",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    notes: `Reserved against ${request.reference}.`,
  });

  const withRequestStatus =
    request.status === "submitted"
      ? patchRow(reserved, "resourceRequests", request._id, { status: "under_review" })
      : reserved;

  return appendAudit(withRequestStatus, {
    entityTable: "matches",
    entityId: matchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: input.batchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Proposed ${quantity} ${batch.unit} of ${batch.reference} for ${request.reference}.`,
  });
}

export function withdrawMatch(
  db: MockDatabase,
  actor: ViewerScope,
  args: { matchId: Id; note?: string },
): MockDatabase {
  const match = requireRow(db, "matches", args.matchId, "Match");
  assertMatchTransition(match.status, "withdrawn");

  const released = applyMovement(db, {
    batchId: match.batchId,
    fromBucket: "reserved",
    toBucket: "available",
    quantity: match.quantityProposed,
    reason: "reservation_released",
    performedByUserId: actor.userId,
    performedByOrgId: actor.orgId,
    notes: args.note ?? "Match withdrawn.",
  });

  const updated = patchRow(released, "matches", args.matchId, {
    status: "withdrawn",
    decidedByUserId: actor.userId,
    decidedAt: Date.now(),
    decisionNote: args.note?.trim() || undefined,
  });

  return appendAudit(updated, {
    entityTable: "matches",
    entityId: args.matchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: match.batchId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: match.status, newValue: "withdrawn" }],
    notes: args.note,
  });
}

/**
 * The brand (or an admin on their behalf) approves or rejects the match.
 * Approval creates the first allocation — manufacturer to custodian.
 */
export function decideMatch(
  db: MockDatabase,
  actor: ViewerScope,
  args: { matchId: Id; approve: boolean; note?: string; custodianOrgId?: Id },
): MockDatabase {
  const match = requireRow(db, "matches", args.matchId, "Match");
  const request = requireRow(db, "resourceRequests", match.requestId, "Request");
  const batch = requireRow(db, "resourceBatches", match.batchId, "Resource batch");

  if (!args.approve) {
    assertMatchTransition(match.status, "rejected");

    const released = applyMovement(db, {
      batchId: match.batchId,
      fromBucket: "reserved",
      toBucket: "available",
      quantity: match.quantityProposed,
      reason: "reservation_released",
      performedByUserId: actor.userId,
      performedByOrgId: actor.orgId,
      notes: args.note ?? "Match rejected — reservation released.",
    });

    const rejected = patchRow(released, "matches", args.matchId, {
      status: "rejected",
      decidedByUserId: actor.userId,
      decidedAt: Date.now(),
      decisionNote: args.note?.trim() || undefined,
    });

    return appendAudit(rejected, {
      entityTable: "matches",
      entityId: args.matchId,
      parentEntityTable: "resourceBatches",
      parentEntityId: match.batchId,
      action: "rejected",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      notes: args.note,
    });
  }

  assertMatchTransition(match.status, "approved");

  const custodianOrgId = args.custodianOrgId ?? match.suggestedCustodianOrgId;

  if (!custodianOrgId) {
    throw new OperationError("Choose a custodian before approving the match.");
  }

  const approved = patchRow(db, "matches", args.matchId, {
    status: "approved",
    decidedByUserId: actor.userId,
    decidedAt: Date.now(),
    decisionNote: args.note?.trim() || undefined,
  });

  const quantityMatched = request.quantityMatched + match.quantityProposed;
  const nextRequestStatus =
    quantityMatched >= request.quantityNeeded ? "matched" : "partially_matched";

  const withRequest = patchRow(approved, "resourceRequests", request._id, {
    quantityMatched,
    status: nextRequestStatus,
  });

  const allocationId = makeId("allocation");
  const custodianFacility = db.facilities.find(
    (facility) => facility.orgId === custodianOrgId && facility.type === "storage",
  );

  const allocation: Allocation = {
    _id: allocationId,
    reference: makeReference(
      "ALC",
      nextSequence(
        db.allocations.map((entry) => entry.reference),
        "CIRKA-ALC",
      ),
    ),
    batchId: match.batchId,
    matchId: match._id,
    requestId: request._id,
    projectId: request.projectId,
    hop: "manufacturer_to_custodian",
    fromOrgId: batch.ownerOrgId,
    fromFacilityId: batch.sourceFacilityId,
    toOrgId: custodianOrgId,
    toFacilityId: custodianFacility?._id,
    quantityAllocated: match.quantityProposed,
    unit: batch.unit,
    status: "proposed",
    proposedByUserId: actor.userId,
    notes: `Created from match on ${request.reference}.`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const withAllocation = insertRow(withRequest, "allocations", allocation);

  const audited = appendAudit(withAllocation, {
    entityTable: "matches",
    entityId: args.matchId,
    parentEntityTable: "resourceBatches",
    parentEntityId: match.batchId,
    action: "approved",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: match.status, newValue: "approved" }],
    notes: args.note,
  });

  return appendAudit(audited, {
    entityTable: "allocations",
    entityId: allocationId,
    parentEntityTable: "resourceBatches",
    parentEntityId: match.batchId,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Allocation proposed to the custodian for ${match.quantityProposed} ${batch.unit}.`,
  });
}
