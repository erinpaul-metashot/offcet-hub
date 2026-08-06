/**
 * Runnable check for the Retexcir contract — the rules the backend will have to
 * enforce, asserted against the mock that specifies them.
 *
 *     npx tsx app/demo/_mock/operations/retexcir.check.ts
 */

import assert from "node:assert";
import { createMockDatabase, DEMO_MANUFACTURER_ID } from "../data";
import {
  connectRetexcirAccount,
  disconnectRetexcirAccount,
  findConnection,
} from "./integrations";
import {
  mapRetexcirPayload,
  pullRetexcirRecords,
  RETEXCIR_QUEUE,
} from "./retexcir";
import { confirmArrival } from "./arrivals";
import { listRetexcirTransfers } from "../selectors-intake";
import type { ViewerScope } from "../visibility";

const db0 = createMockDatabase();
const user = db0.users.find((u) => u._id === DEMO_MANUFACTURER_ID)!;
const actor: ViewerScope = { userId: user._id, orgId: user.orgId, role: user.role } as ViewerScope;
const seededArrivals = db0.pendingArrivals.length;

// 1. No connection: pulling is refused.
assert.throws(() => pullRetexcirRecords(db0, actor), /Connect your Retexcir/);

// 2. Bad account reference is refused.
assert.throws(() => connectRetexcirAccount(db0, actor, { accountRef: "hello" }), /account reference/);

// 3. A mismatched account rejects everything Retexcir sends.
const wrongAccount = connectRetexcirAccount(db0, actor, { accountRef: "retexcir-fac-99" });
assert.equal(findConnection(wrongAccount, actor.orgId, "sorting_system")!.accountRef, "RETEXCIR-FAC-99");
assert.throws(
  () => connectRetexcirAccount(wrongAccount, actor, { accountRef: "RETEXCIR-FAC-99" }),
  /already connected/,
);
const mismatched = pullRetexcirRecords(wrongAccount, actor);
assert.equal(mismatched.accepted, false);
assert.match(mismatched.message, /does not match the connected account/);

// 4. The right account: first record is accepted clean.
const connected = connectRetexcirAccount(db0, actor, { accountRef: "RETEXCIR-FAC-01" });
const first = pullRetexcirRecords(connected, actor);
assert.equal(first.accepted, true);
const arrival = first.db.pendingArrivals.filter((a) => a.ownerOrgId === actor.orgId).at(-1)!;
assert.equal(arrival.externalSystemName, "Retexcir");
assert.equal(arrival.materialCategory, "polyester_blend");
assert.equal(arrival.quantity, 500);
assert.deepEqual(arrival.sourcePayload, RETEXCIR_QUEUE[0]);
assert.ok(findConnection(first.db, actor.orgId, "sorting_system")!.lastSyncedAt);

// 5. Second record is accepted but needs a person: "bales" is not countable.
const gapped = pullRetexcirRecords(first.db, actor);
assert.equal(gapped.accepted, true);
assert.match(gapped.message, /gap/);
const gapArrival = gapped.db.pendingArrivals.filter((a) => a.ownerOrgId === actor.orgId).at(-1)!;
assert.equal(gapArrival.quantity, undefined);
assert.equal(gapArrival.unit, undefined);

// 6. Fourth record is rejected at the door and recorded as a failed transfer.
const third = pullRetexcirRecords(gapped.db, actor);
assert.equal(third.accepted, true);
const rejected = pullRetexcirRecords(third.db, actor);
assert.equal(rejected.accepted, false);
assert.match(rejected.message, /not one CIRKA recognises/);
assert.equal(
  rejected.db.pendingArrivals.filter((a) => a.ownerOrgId === actor.orgId).length,
  gapped.db.pendingArrivals.filter((a) => a.ownerOrgId === actor.orgId).length + 1,
);

// 7. The queue is exhausted, and the log holds every attempt, accepted or not.
assert.throws(() => pullRetexcirRecords(rejected.db, actor), /nothing new sorted/);
const log = listRetexcirTransfers(rejected.db, actor);
assert.equal(log.length, RETEXCIR_QUEUE.length);
assert.deepEqual(
  [...log].map((t) => t.externalRecordId).sort(),
  RETEXCIR_QUEUE.map((p) => p.batchId).sort(),
);
assert.equal(log.filter((t) => t.status === "failed").length, 1);
assert.equal(
  log.find((t) => t.status === "failed")!.externalRecordId,
  "RET-2026-8977",
);

// 8. Disconnect is blocked while pulled records are unresolved, allowed once resolved.
assert.throws(() => disconnectRetexcirAccount(rejected.db, actor), /Confirm or skip/);
const cleared = rejected.db.pendingArrivals
  .filter((a) => a.ownerOrgId === actor.orgId && a.status === "pending")
  .reduce(
    (db, pending) =>
      confirmArrival(db, actor, pending._id, { quantity: 120, unit: "kg", description: "checked" })
        .db,
    rejected.db,
  );
const disconnected = disconnectRetexcirAccount(cleared, actor);
assert.equal(findConnection(disconnected, actor.orgId, "sorting_system"), undefined);

// 9. The confirmed batch keeps its way back to Retexcir.
const batch = cleared.resourceBatches.find((b) => b.externalRecordId === RETEXCIR_QUEUE[0].batchId)!;
assert.equal(batch.dataSource, "sorting_system");
assert.equal(batch.externalRecordUrl, RETEXCIR_QUEUE[0].dashboardUrl);

// 10. Mapping is pure and total: every payload maps without a database.
for (const payload of RETEXCIR_QUEUE) {
  const mapping = mapRetexcirPayload(payload);
  assert.ok(mapping.fields.length > 0);
  assert.equal(Boolean(mapping.arrival), mapping.rejections.length === 0);
}

// 11. Original database untouched throughout.
assert.equal(db0.integrationConnections.filter((c) => c.orgId === actor.orgId).length, 0);
assert.equal(db0.pendingArrivals.length, seededArrivals);

console.log("retexcir flow ok");
