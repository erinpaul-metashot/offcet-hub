/**
 * Runnable check for the derived batch status.
 *
 *     npx tsx app/demo/_mock/batch-status.check.ts
 *
 * "Partially assigned" used to cover two different states. A batch whose only
 * movement is a proposal nobody has accepted must read "Match proposed"; one
 * with an accepted share and a remainder must read "Partially allocated".
 */

import assert from "node:assert";
import { createMockDatabase } from "./data";
import { BATCH_MERINO, BATCH_TWILL, BATCH_WEBBING } from "./data/batches";
import { deriveBatchStatus } from "./ledger";
import type { QuantityPots } from "./types";

const db = createMockDatabase();

function statusOf(batchId: string): string {
  const batch = db.resourceBatches.find((entry) => entry._id === batchId);
  assert.ok(batch, `No seeded batch ${batchId}`);
  return batch.status;
}

/* 1. Seed batches land where the ledger says they are. */
assert.equal(statusOf(BATCH_MERINO), "match_proposed", "Merino is only reserved by a proposed match");
assert.equal(statusOf(BATCH_TWILL), "match_proposed", "Twill is only reserved by a proposed allocation");
assert.equal(statusOf(BATCH_WEBBING), "partially_allocated", "Webbing has an accepted allocation and a remainder");

/* 2. The edges of the rule, on hand-built pots. */
const seedPots = db.resourceBatches[0].pots;
const pots = (overrides: Partial<QuantityPots>): QuantityPots => ({
  ...(Object.fromEntries(Object.keys(seedPots).map((key) => [key, 0])) as unknown as QuantityPots),
  ...overrides,
});
const released = { releasedAt: 1, reviewedAt: 1 };

assert.equal(deriveBatchStatus({ ...released, pots: pots({ available: 50, reserved: 50 }) }), "match_proposed");
assert.equal(
  deriveBatchStatus({ ...released, pots: pots({ available: 10, reserved: 40, allocated: 50 }) }),
  "partially_allocated",
  "an accepted share wins over a pending one",
);
assert.equal(
  deriveBatchStatus({ ...released, pots: pots({ reserved: 40, allocated: 60 }) }),
  "partially_allocated",
  "nothing available but some still unaccepted is not fully allocated",
);
assert.equal(deriveBatchStatus({ ...released, pots: pots({ allocated: 60, in_transit: 40 }) }), "fully_allocated");
assert.equal(deriveBatchStatus({ ...released, pots: pots({ available: 100 }) }), "awaiting_allocation");

console.log("batch-status.check: all assertions passed");
