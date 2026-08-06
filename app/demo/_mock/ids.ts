let counter = 0;

/** Readable, unique-per-session ids: `movement_7`, `allocation_12`. */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

/** Human-readable CIRKA references, e.g. `CIRKA-RB-2026-0417`. */
export function makeReference(kind: "RB" | "PRJ" | "REQ" | "ALC" | "PB", sequence: number): string {
  const year = new Date().getUTCFullYear();
  return `CIRKA-${kind}-${year}-${String(sequence).padStart(4, "0")}`;
}

/** Resets the counter: used by "Reset demo data" so ids stay stable per run. */
export function resetIdCounter(): void {
  counter = 0;
}
