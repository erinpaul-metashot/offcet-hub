/**
 * Field-level visibility: 05_SYSTEM_DESIGN §6.2 and 06_DATA_MODEL §6.
 *
 * Role decides which *records* you see; visibility decides which *fields within
 * a record* you see. Cost data is not merely hidden here: brand-scoped
 * selectors never join to `productionCosts` at all.
 */

import type { CirkaRole } from "./domain";
import type {
  Facility,
  Id,
  Organisation,
  ProductionCost,
  ProductionInput,
  ResourceBatch,
  User,
} from "./types";

export interface ViewerScope {
  userId: Id;
  orgId: Id;
  role: CirkaRole;
}

export function isAdmin(viewer: ViewerScope): boolean {
  return viewer.role === "admin";
}

export function ownsRecord(viewer: ViewerScope, ownerOrgId: Id): boolean {
  return viewer.orgId === ownerOrgId;
}

function isPrivileged(viewer: ViewerScope, ownerOrgId: Id): boolean {
  return isAdmin(viewer) || ownsRecord(viewer, ownerOrgId);
}

/** Returns a copy without the named fields: the protected data is simply not there. */
function omit<T extends object, K extends keyof T>(record: T, fields: readonly K[]): T {
  const copy = { ...record };

  for (const field of fields) {
    delete copy[field];
  }

  return copy;
}

/** `estimatedValue` is protected: never shown to brands. */
export function stripBatch(batch: ResourceBatch, viewer: ViewerScope): ResourceBatch {
  return isPrivileged(viewer, batch.ownerOrgId) ? batch : omit(batch, ["estimatedValue"]);
}

/** Registration and tax references are protected. */
export function stripOrganisation(org: Organisation, viewer: ViewerScope): Organisation {
  return isPrivileged(viewer, org._id) ? org : omit(org, ["taxId", "registrationNumber"]);
}

/** Site contact details are personal data. */
export function stripFacility(facility: Facility, viewer: ViewerScope): Facility {
  return isPrivileged(viewer, facility.orgId)
    ? facility
    : omit(facility, ["contactName", "contactEmail"]);
}

/** Brands see organisation names, not people's contact details. */
export function stripUser(user: User, viewer: ViewerScope): User {
  if (isPrivileged(viewer, user.orgId)) {
    return user;
  }

  return { ...omit(user, ["phone"]), email: "" };
}

/** Supplier name and cost are protected on production inputs. */
export function stripProductionInput(
  input: ProductionInput,
  viewer: ViewerScope,
  makerOrgId: Id,
): ProductionInput {
  return isPrivileged(viewer, makerOrgId)
    ? input
    : omit(input, ["supplierName", "cost", "currency"]);
}

/**
 * The whole cost record is restricted to the maker and CIRKA. The single
 * exception is `baseCostPerUnit` when the maker has explicitly opted in.
 */
export function costsForViewer(
  cost: ProductionCost | undefined,
  viewer: ViewerScope,
): ProductionCost | undefined {
  if (!cost) {
    return undefined;
  }

  if (isAdmin(viewer) || ownsRecord(viewer, cost.makerOrgId)) {
    return cost;
  }

  return undefined;
}

/** What a brand may see of a maker's economics: nothing, unless opted in. */
export function sharedCostPerUnit(cost: ProductionCost | undefined): number | undefined {
  if (!cost || !cost.shareCostPerUnitWithBrand) {
    return undefined;
  }

  return cost.baseCostPerUnit;
}
