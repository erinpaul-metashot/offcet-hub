/**
 * The mock layer's clock.
 *
 * Every operation and selector reads "now" from here rather than calling
 * `Date.now()` directly, so a scripted story can pin the clock to a point in
 * the past and have the operations write historically consistent timestamps —
 * `dispatchedAt`, `receivedAt`, milestone actuals and audit entries all land on
 * the story's date rather than the second the button was pressed.
 *
 * Outside story mode the pin is null and this is exactly `Date.now()`.
 */

import type { Timestamp } from "./types";

// ponytail: module-level pin, single-tab demo only. Per-session clock if /demo
// ever runs multi-tab against shared state.
let pinned: Timestamp | null = null;

export function now(): Timestamp {
  return pinned ?? Date.now();
}

/** Pins the clock to a moment, or releases it with `null`. */
export function pinClock(at: Timestamp | null): void {
  pinned = at;
}

export function isClockPinned(): boolean {
  return pinned !== null;
}

/** Runs `body` with the clock pinned, restoring the previous pin afterwards. */
export function atTime<T>(at: Timestamp | undefined, body: () => T): T {
  const previous = pinned;
  pinned = at ?? previous;

  try {
    return body();
  } finally {
    pinned = previous;
  }
}
