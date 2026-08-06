import type { MockDatabase } from "../types";

export class OperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationError";
  }
}

type TableName = keyof MockDatabase;
type Row<T extends TableName> = MockDatabase[T][number];

export function requireRow<T extends TableName>(
  db: MockDatabase,
  table: T,
  id: string,
  label: string,
): Row<T> {
  const row = (db[table] as Array<{ _id: string }>).find((entry) => entry._id === id);

  if (!row) {
    throw new OperationError(`${label} not found.`);
  }

  return row as Row<T>;
}

/** Immutable row patch: returns a new database, never mutates the old one. */
export function patchRow<T extends TableName>(
  db: MockDatabase,
  table: T,
  id: string,
  patch: Partial<Row<T>>,
): MockDatabase {
  return {
    ...db,
    [table]: (db[table] as Array<{ _id: string }>).map((entry) =>
      entry._id === id ? { ...entry, ...patch } : entry,
    ),
  } as MockDatabase;
}

export function insertRow<T extends TableName>(
  db: MockDatabase,
  table: T,
  row: Row<T>,
): MockDatabase {
  return { ...db, [table]: [...db[table], row] } as MockDatabase;
}

export function removeRow<T extends TableName>(
  db: MockDatabase,
  table: T,
  id: string,
): MockDatabase {
  return {
    ...db,
    [table]: (db[table] as Array<{ _id: string }>).filter((entry) => entry._id !== id),
  } as MockDatabase;
}

export function requireText(value: string | undefined, message: string): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    throw new OperationError(message);
  }

  return trimmed;
}

/* ------------------------------------------------------------------ *
 * Shared field validators
 *
 * Organisations and facilities record the same kinds of value: an address,
 * a country, a coordinate pair, a contact email. They are validated in one
 * place so the two forms cannot drift apart on what counts as valid.
 * ------------------------------------------------------------------ */

const ISO_COUNTRY = /^[A-Z]{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Blank and whitespace both mean "not recorded", never an empty string. */
export function optionalText(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function requireCountryCode(
  value: string | undefined,
  missingMessage = "Country is required.",
): string {
  const code = requireText(value, missingMessage).toUpperCase();

  if (!ISO_COUNTRY.test(code)) {
    throw new OperationError("Country must be a two-letter ISO code, for example SE or PT.");
  }

  return code;
}

export function optionalCoordinate(
  value: number | undefined,
  limit: number,
  message: string,
): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  if (!Number.isFinite(value) || Math.abs(value) > limit) {
    throw new OperationError(message);
  }

  return value;
}

export function requireEmail(value: string | undefined, missingMessage: string): string {
  const email = requireText(value, missingMessage).toLowerCase();

  if (!EMAIL.test(email)) {
    throw new OperationError(`${email} is not a valid email address.`);
  }

  return email;
}

export function optionalEmail(value: string | undefined): string | undefined {
  const trimmed = optionalText(value);
  return trimmed === undefined ? undefined : requireEmail(trimmed, "Email is required.");
}

export function requirePositive(value: number | undefined, message: string): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new OperationError(message);
  }

  return value;
}

/** Same as `requirePositive`, but absent stays absent instead of failing. */
export function optionalPositive(value: number | undefined, message: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requirePositive(value, message);
}

/** Next sequence number for a human-readable reference. */
export function nextSequence(existing: string[], prefix: string): number {
  const numbers = existing
    .filter((reference) => reference.startsWith(prefix))
    .map((reference) => Number(reference.slice(reference.lastIndexOf("-") + 1)))
    .filter((value) => Number.isFinite(value));

  return (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
}
