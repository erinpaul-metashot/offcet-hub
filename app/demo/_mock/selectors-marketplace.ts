/**
 * Available material: the read model behind the marketplace screens.
 *
 * Every lot here is manufacturer-released and CIRKA-reviewed. Who owns it is
 * withheld from anyone who is neither CIRKA nor the owner — brokerage is the
 * product, so the supplier's identity is CIRKA's to disclose, not the
 * listing's. `stripBatch` already removes commercial value on top of that.
 */

import { ORGANISATION_TYPE_LABELS, type MaterialCategory, type MaterialFormat, type QualityClass } from "./domain";
import { isListedLot, listingBlocker } from "./operations/marketplace";
import { potSlices, type PotSlice } from "./selectors-batches";
import { findFacility, findOrganisation, orgName } from "./selectors-shared";
import type { Id, MockDatabase, ResourceBatch, ResourceRequest } from "./types";
import { isAdmin, ownsRecord, stripBatch, type ViewerScope } from "./visibility";

const OPEN_ENQUIRY_STATUSES = ["submitted", "under_review", "partially_matched", "matched", "in_delivery"];

export interface MarketplaceLot {
  batch: ResourceBatch;
  slices: PotSlice[];
  committed: number;
  /** The owning organisation, or a non-identifying stand-in for outside viewers. */
  supplierLabel: string;
  /** Named only for CIRKA and the owner. */
  supplierName?: string;
  region?: string;
  /** How many organisations have an open enquiry. Who they are is CIRKA's alone. */
  enquiryCount: number;
  viewerHasEnquired: boolean;
  /** Set only for the owner and CIRKA. */
  facilityName?: string;
}

export const MARKETPLACE_SORTS = ["newest", "quantity", "name"] as const;
export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];

export const MARKETPLACE_SORT_LABELS: Record<MarketplaceSort, string> = {
  newest: "Recently listed",
  quantity: "Most available",
  name: "Name A–Z",
};

const SORTERS: Record<MarketplaceSort, (left: MarketplaceLot, right: MarketplaceLot) => number> = {
  newest: (left, right) => (right.batch.releasedAt ?? 0) - (left.batch.releasedAt ?? 0),
  quantity: (left, right) => right.batch.pots.available - left.batch.pots.available,
  name: (left, right) => left.batch.name.localeCompare(right.batch.name),
};

export interface MarketplaceFilters {
  category?: MaterialCategory | "";
  format?: MaterialFormat | "";
  qualityClass?: QualityClass | "";
  country?: string;
  minQuantity?: number;
  search?: string;
  sort?: MarketplaceSort;
}

function regionOf(db: MockDatabase, batch: ResourceBatch): string | undefined {
  return findOrganisation(db, batch.ownerOrgId)?.country;
}

function toLot(db: MockDatabase, viewer: ViewerScope, source: ResourceBatch): MarketplaceLot {
  const privileged = isAdmin(viewer) || ownsRecord(viewer, source.ownerOrgId);
  const stripped = stripBatch(source, viewer);
  const owner = findOrganisation(db, source.ownerOrgId);
  const region = owner?.country;

  /* A street address names the supplier as surely as the supplier's name does.
     Outside viewers get the country and nothing finer. */
  const batch: ResourceBatch = privileged
    ? stripped
    : { ...stripped, locationText: undefined, latitude: undefined, longitude: undefined };

  const enquiries = db.resourceRequests.filter(
    (request) =>
      request.sourceBatchId === source._id &&
      !request.deletedAt &&
      OPEN_ENQUIRY_STATUSES.includes(request.status),
  );

  return {
    batch,
    slices: potSlices(batch),
    committed: batch.quantityOriginal - batch.pots.available,
    supplierLabel: privileged
      ? orgName(db, source.ownerOrgId)
      : [ORGANISATION_TYPE_LABELS[owner?.type ?? "manufacturer"], region].filter(Boolean).join(" · "),
    supplierName: privileged ? orgName(db, source.ownerOrgId) : undefined,
    region,
    enquiryCount: enquiries.length,
    viewerHasEnquired: enquiries.some((request) => request.requesterOrgId === viewer.orgId),
    facilityName: privileged ? findFacility(db, source.sourceFacilityId)?.name : undefined,
  };
}

export function listMarketplaceLots(
  db: MockDatabase,
  viewer: ViewerScope,
  filters: MarketplaceFilters = {},
): MarketplaceLot[] {
  const needle = filters.search?.trim().toLowerCase();

  return db.resourceBatches
    .filter(isListedLot)
    .filter((batch) => (filters.category ? batch.materialCategory === filters.category : true))
    .filter((batch) => (filters.format ? batch.format === filters.format : true))
    .filter((batch) => (filters.qualityClass ? batch.qualityClass === filters.qualityClass : true))
    .filter((batch) => (filters.country ? regionOf(db, batch) === filters.country : true))
    .filter((batch) => (filters.minQuantity ? batch.pots.available >= filters.minQuantity : true))
    .filter((batch) =>
      needle
        ? [batch.name, batch.reference, batch.composition, batch.colour, batch.locationText]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(needle))
        : true,
    )
    .map((batch) => toLot(db, viewer, batch))
    .sort(SORTERS[filters.sort ?? "newest"]);
}

/** How many listed lots sit in each category, so the browse chips can carry counts. */
export function marketplaceCategoryCounts(
  lots: MarketplaceLot[],
): Partial<Record<MaterialCategory, number>> {
  return lots.reduce<Partial<Record<MaterialCategory, number>>>((counts, lot) => {
    const key = lot.batch.materialCategory;
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
}

/** Every country with at least one listed lot: the region filter builds itself. */
export function marketplaceCountries(db: MockDatabase): string[] {
  const codes = db.resourceBatches
    .filter(isListedLot)
    .map((batch) => regionOf(db, batch))
    .filter((code): code is string => Boolean(code));

  return Array.from(new Set(codes)).sort();
}

export interface MarketplaceLotDetail extends MarketplaceLot {
  /** Why the lot cannot be enquired about, if it cannot. */
  blocker?: string;
  /** The viewer's own enquiries against this lot. */
  ownEnquiries: ResourceRequest[];
  /** CIRKA only: every open enquiry, with the organisation that raised it. */
  allEnquiries?: Array<{ request: ResourceRequest; requesterName: string }>;
}

export function getMarketplaceLot(
  db: MockDatabase,
  viewer: ViewerScope,
  batchId: Id,
): MarketplaceLotDetail | null {
  const source = db.resourceBatches.find((batch) => batch._id === batchId);

  if (!source) {
    return null;
  }

  const enquiries = db.resourceRequests
    .filter((request) => request.sourceBatchId === batchId && !request.deletedAt)
    .sort((left, right) => right.createdAt - left.createdAt);

  return {
    ...toLot(db, viewer, source),
    blocker: listingBlocker(source),
    ownEnquiries: enquiries.filter((request) => request.requesterOrgId === viewer.orgId),
    allEnquiries: isAdmin(viewer)
      ? enquiries.map((request) => ({
          request,
          requesterName: orgName(db, request.requesterOrgId),
        }))
      : undefined,
  };
}

/** Open enquiries raised against one manufacturer's lots, for the batch detail screen. */
export function enquiriesForBatch(db: MockDatabase, batchId: Id): ResourceRequest[] {
  return db.resourceRequests.filter(
    (request) =>
      request.sourceBatchId === batchId &&
      !request.deletedAt &&
      OPEN_ENQUIRY_STATUSES.includes(request.status),
  );
}
