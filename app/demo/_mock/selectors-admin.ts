/** CIRKA admin views: the action queue, matching workspace and oversight lists. */

import { auditForEntity } from "./audit";
import { buildMonthBuckets } from "./buckets";
import type { Unit } from "./domain";
import { round } from "./ledger";
import { countFacilityReferences } from "./operations/facilities";
import type { Facility, Id, MockDatabase, Organisation, Project, ResourceRequest, User } from "./types";
import type { ViewerScope } from "./visibility";
import { buildActionQueue, groupQueueByKind, groupQueueBySeverity } from "./selectors-actions";
import { aggregatePotSlices, listMatchableBatches, type BatchRow } from "./selectors-batches";
import { getProjectProofView, type JourneyRow } from "./selectors-brand";
import { listHoldings, type Holding } from "./selectors-custodian";
import { findFacility, orgName, topCategories, userName } from "./selectors-shared";

export interface ProjectRow {
  project: Project;
  brandName: string;
  journey: JourneyRow[];
  requestCount: number;
  matchCount: number;
  productionCount: number;
  activated: number;
  incorporated: number;
  unit: Unit;
  evidenceReviewed: number;
}

export function listProjects(
  db: MockDatabase,
  viewer: ViewerScope,
  filters: { search?: string; status?: string; brandOrgId?: Id } = {},
): ProjectRow[] {
  return db.projects
    .filter((project) => !project.deletedAt)
    .filter((project) => (filters.status ? project.status === filters.status : true))
    .filter((project) => (filters.brandOrgId ? project.brandOrgId === filters.brandOrgId : true))
    .filter((project) => {
      if (!filters.search) return true;
      const needle = filters.search.toLowerCase();
      return (
        project.title.toLowerCase().includes(needle) ||
        project.reference.toLowerCase().includes(needle) ||
        orgName(db, project.brandOrgId).toLowerCase().includes(needle)
      );
    })
    .map((project) => {
      const proof = getProjectProofView(db, viewer, project._id);
      if (!proof) {
        throw new Error(`Project ${project._id} disappeared while building the list.`);
      }

      return {
        project,
        brandName: proof.brandName,
        journey: proof.journey,
        requestCount: proof.requests.length,
        matchCount: proof.matches.length,
        productionCount: proof.production.length,
        activated: proof.material.activated,
        incorporated: proof.material.incorporated,
        unit: proof.material.unit,
        evidenceReviewed: proof.assurance.reviewed,
      };
    })
    .sort((left, right) => right.project.createdAt - left.project.createdAt);
}

/** High-level counts across every project: the admin projects dashboard header. */
export function getProjectsOverview(db: MockDatabase, viewer: ViewerScope) {
  const rows = listProjects(db, viewer);
  const active = rows.filter((row) => row.project.status === "active");

  return {
    totalProjects: rows.length,
    activeProjects: active.length,
    overdueProjects: rows.filter((row) =>
      row.journey.some((entry) => entry.status === "overdue"),
    ).length,
    openRequests: active.reduce((sum, row) => sum + row.requestCount, 0),
    inProduction: active.reduce((sum, row) => sum + row.productionCount, 0),
  };
}

export interface ManagedUser {
  user: User;
  organisation?: Organisation;
  reviewerName?: string;
}

export function getUserManagementView(db: MockDatabase) {
  const managed: ManagedUser[] = db.users
    .filter((user) => !user.deletedAt)
    .map((user) => ({
      user,
      organisation: db.organisations.find((org) => org._id === user.orgId),
      reviewerName: db.users.find((entry) => entry._id === user.reviewedBy)?.name,
    }));

  return {
    all: managed.sort((left, right) => right.user.createdAt - left.user.createdAt),
    pending: managed.filter((entry) => entry.user.status === "pending"),
    approved: managed.filter((entry) => entry.user.status === "approved"),
    rejected: managed.filter((entry) => entry.user.status === "rejected"),
    disabled: managed.filter((entry) => entry.user.status === "disabled"),
  };
}

export function listOrganisations(db: MockDatabase) {
  return db.organisations
    .filter((org) => !org.deletedAt)
    .map((org) => ({
      organisation: org,
      userCount: db.users.filter((user) => user.orgId === org._id && !user.deletedAt).length,
      facilityCount: db.facilities.filter(
        (facility) => facility.orgId === org._id && !facility.deletedAt,
      ).length,
      batchCount: db.resourceBatches.filter((batch) => batch.ownerOrgId === org._id).length,
      allocationCount: db.allocations.filter(
        (allocation) => allocation.fromOrgId === org._id || allocation.toOrgId === org._id,
      ).length,
    }))
    .sort((left, right) => left.organisation.name.localeCompare(right.organisation.name));
}

/** A person on the organisation's roster, with the reasons they may be undeletable. */
export interface OrganisationPerson {
  user: User;
  reviewerName?: string;
  /** Removing the last owner would leave nobody able to manage the org (§20). */
  isOnlyOwner: boolean;
}

/** A site, with everything that would be orphaned if it were removed. */
export interface OrganisationFacility {
  facility: Facility;
  batchCount: number;
  allocationCount: number;
  productionCount: number;
  /** False once material has moved through it: deactivate instead. */
  canRemove: boolean;
}

export function getOrganisationDetails(db: MockDatabase, orgId: Id) {
  const org = db.organisations.find((o) => o._id === orgId);
  if (!org || org.deletedAt) return null;

  const roster = db.users.filter((user) => user.orgId === orgId && !user.deletedAt);
  const activeOwners = roster.filter(
    (user) => user.orgRole === "owner" && user.status !== "disabled",
  );

  const users: OrganisationPerson[] = roster.map((user) => ({
    user,
    reviewerName: db.users.find((u) => u._id === user.reviewedBy)?.name,
    isOnlyOwner:
      user.orgRole === "owner" &&
      user.status !== "disabled" &&
      activeOwners.length === 1,
  }));

  const facilities: OrganisationFacility[] = db.facilities
    .filter((facility) => facility.orgId === orgId && !facility.deletedAt)
    .map((facility) => {
      const references = countFacilityReferences(db, facility._id);

      return {
        facility,
        batchCount: references.batches,
        allocationCount: references.allocations,
        productionCount: references.production,
        canRemove: references.total === 0,
      };
    })
    .sort((left, right) => left.facility.name.localeCompare(right.facility.name));

  return {
    organisation: org,
    users,
    facilities,
    batches: db.resourceBatches.filter((batch) => batch.ownerOrgId === orgId && !batch.deletedAt),
    allocations: db.allocations.filter(
      (allocation) => (allocation.fromOrgId === orgId || allocation.toOrgId === orgId) && !allocation.deletedAt
    ),
    projects: db.projects.filter((project) => project.brandOrgId === orgId && !project.deletedAt),
    requests: db.resourceRequests.filter((request) => request.requesterOrgId === orgId && !request.deletedAt),
  };
}

export function listRequests(db: MockDatabase) {
  return db.resourceRequests
    .filter((request) => !request.deletedAt)
    .map((request) => ({
      request,
      requesterName: orgName(db, request.requesterOrgId),
      project: db.projects.find((project) => project._id === request.projectId),
      matches: db.matches.filter((match) => match.requestId === request._id),
    }))
    .sort((left, right) => {
      const leftDate = left.request.submittedAt ?? left.request.createdAt;
      const rightDate = right.request.submittedAt ?? right.request.createdAt;
      return rightDate - leftDate;
    });
}

/** High-level metrics across every request: the admin requests dashboard header. */
export function getRequestsOverview(db: MockDatabase) {
  const rows = listRequests(db);
  const totalRequests = rows.length;
  const awaitingMatch = rows.filter((r) =>
    ["submitted", "under_review"].includes(r.request.status),
  ).length;
  const matched = rows.filter((r) =>
    ["matched", "in_delivery", "fulfilled", "partially_matched"].includes(r.request.status),
  ).length;
  const totalMatches = rows.reduce((sum, r) => sum + r.matches.length, 0);

  return {
    totalRequests,
    awaitingMatch,
    matched,
    totalMatches,
  };
}


/**
 * Shortlisting is a convenience, not a decision (05_SYSTEM_DESIGN §5). The
 * system sorts candidates by category fit, quantity fit and distance; a person
 * still chooses and writes the reason.
 */
export interface Candidate {
  row: BatchRow;
  categoryFit: boolean;
  quantityFit: boolean;
  distanceKm?: number;
  score: number;
  /** The requester enquired about this exact lot on the marketplace. */
  requested: boolean;
}

function distanceBetween(
  from?: { latitude?: number; longitude?: number },
  to?: { latitude?: number; longitude?: number },
): number | undefined {
  if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) {
    return undefined;
  }

  const radius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(deltaLon / 2) ** 2;

  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function shortlistCandidates(
  db: MockDatabase,
  viewer: ViewerScope,
  request: ResourceRequest,
): Candidate[] {
  const requester = db.organisations.find((org) => org._id === request.requesterOrgId);

  return listMatchableBatches(db, viewer)
    .map((row) => {
      const owner = db.organisations.find((org) => org._id === row.batch.ownerOrgId);
      const categoryFit = row.batch.materialCategory === request.materialCategory;
      const quantityFit = row.batch.pots.available >= request.quantityNeeded;
      const distance = distanceBetween(owner, requester);
      /* An enquiry names its lot. That is a stated preference, not a decision:
         it sorts first, and the administrator still chooses. */
      const requested = row.batch._id === request.sourceBatchId;

      const score =
        (requested ? 1000 : 0) +
        (categoryFit ? 100 : 0) +
        (quantityFit ? 50 : 0) +
        (distance === undefined ? 0 : Math.max(0, 40 - distance / 25));

      return { row, categoryFit, quantityFit, distanceKm: distance, score, requested };
    })
    .sort((left, right) => right.score - left.score);
}

export function getMatchingWorkspace(db: MockDatabase, viewer: ViewerScope, requestId: Id) {
  const request = db.resourceRequests.find((entry) => entry._id === requestId);

  if (!request) {
    return null;
  }

  return {
    request,
    requesterName: orgName(db, request.requesterOrgId),
    project: db.projects.find((project) => project._id === request.projectId),
    candidates: shortlistCandidates(db, viewer, request),
    matches: db.matches
      .filter((match) => match.requestId === requestId)
      .map((match) => ({
        match,
        batch: db.resourceBatches.find((batch) => batch._id === match.batchId),
        custodianName: match.suggestedCustodianOrgId
          ? orgName(db, match.suggestedCustodianOrgId)
          : undefined,
        makerName: match.suggestedMakerOrgId ? orgName(db, match.suggestedMakerOrgId) : undefined,
      }))
      .sort((left, right) => right.match.proposedAt - left.match.proposedAt),
    custodians: db.organisations.filter(
      (org) => org.type === "custodian" && org.status === "approved",
    ),
    makers: db.organisations.filter((org) => org.type === "maker" && org.status === "approved"),
  };
}

export type MatchingWorkspace = NonNullable<ReturnType<typeof getMatchingWorkspace>>;

export function listAllocationsOverview(db: MockDatabase) {
  return db.allocations
    .map((allocation) => ({
      allocation,
      batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
      fromName: orgName(db, allocation.fromOrgId),
      toName: orgName(db, allocation.toOrgId),
      project: db.projects.find((project) => project._id === allocation.projectId),
    }))
    .sort((left, right) => right.allocation.updatedAt - left.allocation.updatedAt);
}

export interface CustodianStockRow {
  custodian: Organisation;
  holding: Holding;
}

/**
 * Every lot sitting in a warehouse, across all custodians. The second hop is
 * CIRKA's call, so this is the list admin assigns makers from.
 */
export function listCustodianStock(db: MockDatabase): CustodianStockRow[] {
  return db.organisations
    .filter((org) => org.type === "custodian" && org.status === "approved")
    .flatMap((custodian) =>
      listHoldings(db, custodian._id).map((holding) => ({ custodian, holding })),
    )
    .sort((left, right) => right.holding.uncommitted - left.holding.uncommitted);
}

export function getAllocationDetail(db: MockDatabase, allocationId: Id) {
  const allocation = db.allocations.find((entry) => entry._id === allocationId);
  if (!allocation) return null;

  return {
    allocation,
    batch: db.resourceBatches.find((batch) => batch._id === allocation.batchId),
    project: db.projects.find((project) => project._id === allocation.projectId),
    fromName: orgName(db, allocation.fromOrgId),
    toName: orgName(db, allocation.toOrgId),
    fromFacility: findFacility(db, allocation.fromFacilityId),
    toFacility: findFacility(db, allocation.toFacilityId),
    proposedByName: userName(db, allocation.proposedByUserId),
    respondedByName: allocation.respondedByUserId ? userName(db, allocation.respondedByUserId) : undefined,
    discrepancyResolvedByName: allocation.discrepancyResolvedByUserId
      ? userName(db, allocation.discrepancyResolvedByUserId)
      : undefined,
    audit: auditForEntity(db, "allocations", allocationId),
  };
}

export type AllocationDetail = NonNullable<ReturnType<typeof getAllocationDetail>>;

export function listProductionOverview(db: MockDatabase) {
  return db.productionBatches
    .map((production) => ({
      production,
      makerName: orgName(db, production.makerOrgId),
      batch: db.resourceBatches.find((batch) => batch._id === production.batchId),
      project: db.projects.find((project) => project._id === production.projectId),
      outputs: db.productionOutputs.filter(
        (output) => output.productionBatchId === production._id,
      ),
      evidenceCount: db.evidenceItems.filter(
        (item) => item.entityTable === "productionBatches" && item.entityId === production._id,
      ).length,
    }))
    .sort((left, right) => right.production.updatedAt - left.production.updatedAt);
}

export function listImportJobs(db: MockDatabase) {
  return db.importJobs
    .map((job) => ({
      job,
      orgLabel: orgName(db, job.orgId),
      uploadedBy: db.users.find((user) => user._id === job.uploadedByUserId)?.name,
      batches: db.resourceBatches.filter((batch) => batch.importJobId === job._id),
    }))
    .sort((left, right) => right.job.createdAt - left.job.createdAt);
}

export function listTransfers(db: MockDatabase) {
  return db.integrationTransfers
    .map((transfer) => ({
      transfer,
      entityLabel:
        transfer.entityTable === "resourceBatches"
          ? db.resourceBatches.find((batch) => batch._id === transfer.entityId)?.reference
          : db.productionBatches.find((production) => production._id === transfer.entityId)
              ?.reference,
    }))
    .sort((left, right) => right.transfer.createdAt - left.transfer.createdAt);
}

export function getAdminDashboard(db: MockDatabase) {
  const queue = buildActionQueue(db);
  const batches = db.resourceBatches.filter((batch) => !batch.deletedAt);

  const recorded = round(batches.reduce((total, batch) => total + batch.quantityOriginal, 0));
  const available = round(batches.reduce((total, batch) => total + batch.pots.available, 0));
  const inMotion = round(
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
  const consumed = round(batches.reduce((total, batch) => total + batch.pots.consumed, 0));
  const writtenOff = round(batches.reduce((total, batch) => total + batch.pots.written_off, 0));
  const unexplained = round(batches.reduce((total, batch) => total + batch.pots.unexplained, 0));

  return {
    queue,
    queueGroups: groupQueueByKind(queue),
    queueBySeverity: groupQueueBySeverity(queue),
    potSlices: aggregatePotSlices(batches),
    metrics: {
      openActions: queue.length,
      blocking: queue.filter((row) => row.severity === "blocking").length,
      warning: queue.filter((row) => row.severity === "warning").length,
      info: queue.filter((row) => row.severity === "info").length,
      pendingUsers: db.users.filter((user) => user.status === "pending").length,
      pendingOrganisations: db.organisations.filter((org) => org.status === "pending").length,
      batchCount: batches.length,
      recorded,
      available,
      inMotion,
      consumed,
      writtenOff,
      unexplained,
      activeProjects: db.projects.filter((project) => project.status === "active").length,
      openRequests: db.resourceRequests.filter((request) =>
        ["submitted", "under_review", "partially_matched"].includes(request.status),
      ).length,
      productionAwaitingReview: db.productionBatches.filter(
        (production) => production.status === "evidence_submitted",
      ).length,
      failedTransfers: db.integrationTransfers.filter((transfer) => transfer.status === "failed")
        .length,
    },
    trend: buildMonthBuckets(batches.map((batch) => batch.createdAt)),
    categories: topCategories(batches),
    recentAudit: db.auditLog
      .slice()
      .sort((left, right) => right.occurredAt - left.occurredAt)
      .slice(0, 8)
      .map((entry) => ({
        entry,
        actorName: db.users.find((user) => user._id === entry.actorUserId)?.name ?? "System",
      })),
  };
}
