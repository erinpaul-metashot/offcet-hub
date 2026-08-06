/**
 * Runnable check for the custodian contract — a custodian is a warehouse. It
 * accepts material in and hands it over, but CIRKA decides who receives it,
 * and damage on its floor comes off the ledger without breaking the invariant.
 *
 *     npx tsx app/demo/_mock/operations/custody.check.ts
 */

import assert from "node:assert";
import { createMockDatabase } from "../data";
import { assertInvariant, round } from "../ledger";
import { listHoldings } from "../selectors-custodian";
import {
  proposeAllocationToCustodian,
  proposeAllocationToMaker,
  respondToAllocation,
} from "./allocations";
import { reportStorageDamage } from "./batches";
import type { ViewerScope } from "../visibility";

const db0 = createMockDatabase();

function scopeFor(orgId: string): ViewerScope {
  const user = db0.users.find((entry) => entry.orgId === orgId)!;
  return { userId: user._id, orgId: user.orgId, role: user.role };
}

const custodianOrgId = db0.organisations.find((org) => org.type === "custodian")!._id;
const makerOrgId = db0.organisations.find((org) => org.type === "maker")!._id;
const custodian = scopeFor(custodianOrgId);
const admin = scopeFor(db0.organisations.find((org) => org.type === "cirka")?._id ?? "");

const holding = listHoldings(db0, custodianOrgId).find((entry) => entry.uncommitted > 0)!;
assert.ok(holding, "The seed must leave a custodian holding something unassigned.");

/* 1. The custodian cannot choose who receives its stock. */
assert.throws(
  () =>
    proposeAllocationToMaker(db0, custodian, {
      batchId: holding.batch._id,
      fromOrgId: custodianOrgId,
      toOrgId: makerOrgId,
      quantity: 1,
    }),
  /Only CIRKA assigns/,
);

/* 2. CIRKA can, but only out of the warehouse that actually confirmed receipt. */
const otherCustodianOrgId = db0.organisations.find(
  (org) => org.type === "custodian" && org._id !== custodianOrgId,
)!._id;
assert.throws(
  () =>
    proposeAllocationToMaker(db0, admin, {
      batchId: holding.batch._id,
      fromOrgId: otherCustodianOrgId,
      toOrgId: makerOrgId,
      quantity: 1,
    }),
  /has not confirmed receipt/,
);

const assigned = proposeAllocationToMaker(db0, admin, {
  batchId: holding.batch._id,
  fromOrgId: custodianOrgId,
  toOrgId: makerOrgId,
  quantity: holding.uncommitted,
});

const created = assigned.allocations.find(
  (allocation) =>
    allocation.hop === "custodian_to_maker" &&
    allocation.fromOrgId === custodianOrgId &&
    allocation.toOrgId === makerOrgId &&
    !db0.allocations.some((existing) => existing._id === allocation._id),
)!;
assert.equal(created.fromOrgId, custodianOrgId, "The custodian is the sender, not the actor.");

/* 3. Nothing is left to assign once CIRKA has committed the lot. */
assert.throws(
  () =>
    proposeAllocationToMaker(assigned, admin, {
      batchId: holding.batch._id,
      fromOrgId: custodianOrgId,
      toOrgId: makerOrgId,
      quantity: 1,
    }),
  /is already assigned to makers/,
);

/* 4. Damage on the custodian's floor leaves the held pot and the ledger still balances. */
const damaged = reportStorageDamage(db0, custodian, {
  batchId: holding.batch._id,
  quantity: 5,
  reason: "Roof leak during the storm.",
});

const before = db0.resourceBatches.find((batch) => batch._id === holding.batch._id)!;
const after = damaged.resourceBatches.find((batch) => batch._id === holding.batch._id)!;

assert.equal(after.pots.at_custodian, round(before.pots.at_custodian - 5));
assert.equal(after.pots.written_off, round(before.pots.written_off + 5));
assert.equal(after.exceptionStatus, "damaged");
assertInvariant(after);

/* 5. Only the custodian holding it may report against it. */
assert.throws(
  () =>
    reportStorageDamage(damaged, scopeFor(makerOrgId), {
      batchId: holding.batch._id,
      quantity: 1,
      reason: "Not mine to report.",
    }),
  /Only the custodian holding/,
);

/* 6. A reason is required: "5 kg gone" is not an explanation. */
assert.throws(
  () =>
    reportStorageDamage(db0, custodian, {
      batchId: holding.batch._id,
      quantity: 5,
      reason: "  ",
    }),
  /Describe what happened/,
);

/* ── The first hop: CIRKA places a reviewed batch, the custodian accepts. ── */

const manufacturerOrgId = db0.organisations.find((org) => org.type === "manufacturer")!._id;
const placeable = db0.resourceBatches.find(
  (batch) => batch.reviewedAt !== undefined && batch.pots.available > 0,
)!;
assert.ok(placeable, "The seed must leave a reviewed batch with unallocated quantity.");

/* 7. Nobody but CIRKA opens the first hop. */
assert.throws(
  () =>
    proposeAllocationToCustodian(db0, scopeFor(manufacturerOrgId), {
      batchId: placeable._id,
      toOrgId: custodianOrgId,
      quantity: 1,
    }),
  /Only CIRKA places/,
);

/* 8. Review comes first: an unreviewed batch cannot be placed. */
const unreviewed = db0.resourceBatches.find((batch) => batch.reviewedAt === undefined);
if (unreviewed) {
  assert.throws(
    () =>
      proposeAllocationToCustodian(db0, admin, {
        batchId: unreviewed._id,
        toOrgId: custodianOrgId,
        quantity: 1,
      }),
    /awaiting CIRKA review/,
  );
}

/* 9. Only what is actually unallocated can be promised. */
assert.throws(
  () =>
    proposeAllocationToCustodian(db0, admin, {
      batchId: placeable._id,
      toOrgId: custodianOrgId,
      quantity: placeable.pots.available + 1,
    }),
  /still unallocated/,
);

const placed = proposeAllocationToCustodian(db0, admin, {
  batchId: placeable._id,
  toOrgId: custodianOrgId,
  quantity: placeable.pots.available,
  notes: "Hold for the Nordic spring line.",
});

const firstHop = placed.allocations.find(
  (allocation) => !db0.allocations.some((existing) => existing._id === allocation._id),
)!;
assert.equal(firstHop.hop, "manufacturer_to_custodian");
assert.equal(firstHop.status, "proposed");
assert.equal(firstHop.fromOrgId, placeable.ownerOrgId, "The manufacturer is the sender.");

const afterPlacing = placed.resourceBatches.find((batch) => batch._id === placeable._id)!;
assert.equal(afterPlacing.pots.available, 0, "Placing reserves the quantity.");
assert.equal(
  afterPlacing.pots.reserved,
  round(placeable.pots.reserved + placeable.pots.available),
);
assertInvariant(afterPlacing);

/* 10. The custodian accepts before anything is dispatched. */
const accepted = respondToAllocation(placed, custodian, {
  allocationId: firstHop._id,
  accept: true,
});

assert.equal(
  accepted.allocations.find((allocation) => allocation._id === firstHop._id)!.status,
  "accepted",
);

const afterAccepting = accepted.resourceBatches.find((batch) => batch._id === placeable._id)!;
assert.equal(
  afterAccepting.pots.allocated,
  round(placeable.pots.allocated + placeable.pots.available),
  "Acceptance turns the reservation into a commitment.",
);
assertInvariant(afterAccepting);

console.log("custody.check: all assertions passed.");
