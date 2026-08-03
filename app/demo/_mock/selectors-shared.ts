/** Lookups and formatting shared by every role's screens. */

import {
  MATERIAL_CATEGORY_LABELS,
  UNIT_LABELS,
  type MaterialCategory,
  type Unit,
} from "./domain";
import { activeQuantity, round } from "./ledger";
import type {
  Allocation,
  Facility,
  Id,
  MockDatabase,
  Organisation,
  ProductionBatch,
  ResourceBatch,
  User,
} from "./types";

export function findOrganisation(db: MockDatabase, orgId?: Id): Organisation | undefined {
  return orgId ? db.organisations.find((org) => org._id === orgId) : undefined;
}

export function orgName(db: MockDatabase, orgId?: Id): string {
  return findOrganisation(db, orgId)?.name ?? "Unknown organisation";
}

export function findUser(db: MockDatabase, userId?: Id): User | undefined {
  return userId ? db.users.find((user) => user._id === userId) : undefined;
}

export function userName(db: MockDatabase, userId?: Id): string {
  return findUser(db, userId)?.name ?? "CIRKA";
}

export function findFacility(db: MockDatabase, facilityId?: Id): Facility | undefined {
  return facilityId ? db.facilities.find((facility) => facility._id === facilityId) : undefined;
}

export function findBatch(db: MockDatabase, batchId?: Id): ResourceBatch | undefined {
  return batchId ? db.resourceBatches.find((batch) => batch._id === batchId) : undefined;
}

export function findAllocation(db: MockDatabase, allocationId?: Id): Allocation | undefined {
  return allocationId
    ? db.allocations.find((allocation) => allocation._id === allocationId)
    : undefined;
}

export function findProduction(db: MockDatabase, productionId?: Id): ProductionBatch | undefined {
  return productionId
    ? db.productionBatches.find((production) => production._id === productionId)
    : undefined;
}

export function categoryLabel(category: MaterialCategory): string {
  return MATERIAL_CATEGORY_LABELS[category] ?? category;
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const rounded = round(quantity);
  const value = Number.isInteger(rounded) ? rounded.toLocaleString("en-GB") : rounded.toString();
  return `${value} ${UNIT_LABELS[unit]}`;
}

export function formatNumber(value: number): string {
  return round(value).toLocaleString("en-GB");
}

export function formatCurrency(value?: number, currency = "SEK"): string {
  if (value === undefined) {
    return "—";
  }

  return `${Math.round(value).toLocaleString("en-GB")} ${currency}`;
}

export function formatPercent(fraction?: number): string {
  if (fraction === undefined) {
    return "—";
  }

  return `${(fraction * 100).toFixed(1)}%`;
}

/** Quantity that is still in play — used across the dashboards. */
export function batchActiveQuantity(batch: ResourceBatch): number {
  return activeQuantity(batch.pots);
}

export function batchesForOrg(db: MockDatabase, orgId: Id): ResourceBatch[] {
  return db.resourceBatches
    .filter((batch) => batch.ownerOrgId === orgId && !batch.deletedAt)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function allocationsForOrg(db: MockDatabase, orgId: Id): Allocation[] {
  return db.allocations
    .filter((allocation) => allocation.fromOrgId === orgId || allocation.toOrgId === orgId)
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export function allocationsForBatch(db: MockDatabase, batchId: Id): Allocation[] {
  return db.allocations
    .filter((allocation) => allocation.batchId === batchId)
    .sort((left, right) => left.createdAt - right.createdAt);
}

export function movementsForBatch(db: MockDatabase, batchId: Id) {
  return db.quantityMovements
    .filter((movement) => movement.batchId === batchId)
    .sort((left, right) => right.occurredAt - left.occurredAt);
}

export function productionForBatch(db: MockDatabase, batchId: Id): ProductionBatch[] {
  return db.productionBatches.filter((production) => production.batchId === batchId);
}

export function evidenceFor(db: MockDatabase, entityTable: string, entityId: Id) {
  return db.evidenceItems
    .filter(
      (item) => item.entityTable === entityTable && item.entityId === entityId && !item.deletedAt,
    )
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function transfersFor(db: MockDatabase, entityTable: string, entityId: Id) {
  return db.integrationTransfers
    .filter((transfer) => transfer.entityTable === entityTable && transfer.entityId === entityId)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function isOverdue(date?: number): boolean {
  return date !== undefined && date < Date.now();
}

export function daysBetween(from: number, to: number): number {
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/** "3 days late" / "on time" for the journey table. */
export function scheduleNote(planned?: number, actual?: number): string | undefined {
  if (planned === undefined) {
    return undefined;
  }

  const reference = actual ?? Date.now();
  const difference = daysBetween(planned, reference);

  if (difference <= 0) {
    return actual ? "On time" : undefined;
  }

  return `${difference} day${difference === 1 ? "" : "s"} ${actual ? "late" : "overdue"}`;
}

export function topCategories(records: Array<{ materialCategory: MaterialCategory }>, limit = 5) {
  const counts = records.reduce<Record<string, number>>((summary, record) => {
    return { ...summary, [record.materialCategory]: (summary[record.materialCategory] ?? 0) + 1 };
  }, {});

  return Object.entries(counts)
    .map(([category, value]) => ({
      label: categoryLabel(category as MaterialCategory),
      value,
      tone: "accent" as const,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}
