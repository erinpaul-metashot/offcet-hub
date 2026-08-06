/**
 * Runnable check for the arrival-issue contract — a quality report is not a
 * quantity movement, and the ledger has to prove it.
 *
 *     npx tsx app/demo/_mock/operations/arrival-issue.check.ts
 */

import assert from "node:assert";
import { createMockDatabase } from "../data";
import { reportArrivalIssue, findOpenArrivalIssue } from "./allocations";
import { closeActionItem } from "./admin";
import { listExpectedArrivals } from "../selectors-custodian";
import type { ViewerScope } from "../visibility";

const db0 = createMockDatabase();

const inTransit = db0.allocations.find((a) => a.status === "in_transit")!;
const custodian = db0.users.find((u) => u.orgId === inTransit.toOrgId)!;
const actor: ViewerScope = {
  userId: custodian._id,
  orgId: custodian.orgId,
  role: custodian.role,
} as ViewerScope;

const potsBefore = { ...db0.resourceBatches.find((b) => b._id === inTransit.batchId)!.pots };
const movementsBefore = db0.quantityMovements.length;

// 1. A note is required: an issue with no description tells an admin nothing.
assert.throws(
  () => reportArrivalIssue(db0, actor, { allocationId: inTransit._id, issue: "damaged", note: " " }),
  /Describe what is wrong/,
);

// 2. Only the receiving organisation may report.
const outsider: ViewerScope = { ...actor, orgId: inTransit.fromOrgId };
assert.throws(
  () =>
    reportArrivalIssue(db0, outsider, {
      allocationId: inTransit._id,
      issue: "damaged",
      note: "Not mine to report.",
    }),
  /Only the receiving organisation/,
);

// 3. Nothing dispatched, nothing to inspect.
const proposed = db0.allocations.find((a) => a.status === "proposed");
if (proposed) {
  const receiver = db0.users.find((u) => u.orgId === proposed.toOrgId)!;
  assert.throws(
    () =>
      reportArrivalIssue(
        db0,
        { userId: receiver._id, orgId: receiver.orgId, role: receiver.role } as ViewerScope,
        { allocationId: proposed._id, issue: "damaged", note: "Nothing here yet." },
      ),
    /nothing to inspect/,
  );
}

// 4. A valid report opens one blocking item and moves no quantity.
const reported = reportArrivalIssue(db0, actor, {
  allocationId: inTransit._id,
  issue: "damaged",
  note: "Two bales soaked through on the top layer.",
});

const item = findOpenArrivalIssue(reported, inTransit._id)!;
assert.equal(item.severity, "blocking");
assert.equal(item.assignedToRole, "admin");
assert.equal(item.kind, "arrival_issue");
assert.deepEqual(reported.resourceBatches.find((b) => b._id === inTransit.batchId)!.pots, potsBefore);
assert.equal(reported.quantityMovements.length, movementsBefore);
assert.equal(
  reported.allocations.find((a) => a._id === inTransit._id)!.status,
  inTransit.status,
  "reporting an issue must not move the allocation's status",
);
assert.ok(reported.auditLog.at(-1)!.notes!.includes("soaked through"));

// 5. One open issue at a time.
assert.throws(
  () =>
    reportArrivalIssue(reported, actor, {
      allocationId: inTransit._id,
      issue: "late",
      note: "Also late.",
    }),
  /already open/,
);

// 6. The arrival stays on the custodian's list while the issue is open, and a
//    second report is possible once an admin has closed the first.
const admin = db0.users.find((u) => u.role === "admin")!;
const closed = closeActionItem(
  reported,
  { userId: admin._id, orgId: admin.orgId, role: "admin" } as ViewerScope,
  { actionItemId: item._id, note: "Sender credited the damaged bales." },
);
assert.equal(findOpenArrivalIssue(closed, inTransit._id), undefined);
assert.ok(
  listExpectedArrivals(reported, actor.orgId).some(
    (entry) => entry.allocation._id === inTransit._id && entry.openIssue !== undefined,
  ),
);
assert.ok(
  reportArrivalIssue(closed, actor, {
    allocationId: inTransit._id,
    issue: "late",
    note: "Replacement also arrived late.",
  }),
);

// 7. Original database untouched throughout.
assert.equal(db0.actionItems.length, createMockDatabase().actionItems.length);

console.log("arrival issue flow ok");
