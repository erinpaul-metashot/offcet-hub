/**
 * The append-only audit log. Records cannot be silently edited in place:
 * every meaningful change carries an action, a before/after, a person and a
 * time (04_ARCHITECTURE §2, revision notes §7).
 */

import type { ActorType, AuditAction } from "./domain";
import { makeId } from "./ids";
import type { AuditEntry, FieldChange, Id, MockDatabase, Timestamp } from "./types";

export interface AuditInput {
  entityTable: string;
  entityId: Id;
  parentEntityTable?: string;
  parentEntityId?: Id;
  action: AuditAction;
  fieldChanges?: FieldChange[];
  actorUserId?: Id;
  actorOrgId?: Id;
  actorType?: ActorType;
  occurredAt?: Timestamp;
  notes?: string;
}

export function appendAudit(db: MockDatabase, input: AuditInput): MockDatabase {
  const entry: AuditEntry = {
    _id: makeId("audit"),
    entityTable: input.entityTable,
    entityId: input.entityId,
    parentEntityTable: input.parentEntityTable,
    parentEntityId: input.parentEntityId,
    action: input.action,
    fieldChanges: input.fieldChanges,
    actorUserId: input.actorUserId,
    actorOrgId: input.actorOrgId,
    actorType: input.actorType ?? "user",
    occurredAt: input.occurredAt ?? Date.now(),
    notes: input.notes,
  };

  return { ...db, auditLog: [...db.auditLog, entry] };
}

/** Convenience for the common "one field changed" case. */
export function statusChange(field: string, previous: string, next: string): FieldChange[] {
  return [{ field, previousValue: previous, newValue: next }];
}

/** Builds the field-change list for a patch, skipping untouched fields. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  patch: Partial<T>,
): FieldChange[] {
  return Object.entries(patch)
    .filter(([field, value]) => before[field] !== value)
    .map(([field, value]) => ({
      field,
      previousValue: formatValue(before[field]),
      newValue: formatValue(value),
    }));
}

function formatValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export function auditForEntity(db: MockDatabase, entityTable: string, entityId: Id): AuditEntry[] {
  return db.auditLog
    .filter(
      (entry) =>
        (entry.entityTable === entityTable && entry.entityId === entityId) ||
        (entry.parentEntityTable === entityTable && entry.parentEntityId === entityId),
    )
    .sort((left, right) => right.occurredAt - left.occurredAt);
}
