/**
 * Runnable check for the timeline projections.
 *
 *     npx tsx app/demo/_mock/timeline.check.ts
 *
 * Two things have to hold. Every event must read as a sentence — no raw
 * `status_changed · allocations` survivors — and role scoping must actually
 * remove events rather than merely hide them.
 */

import assert from "node:assert";
import { BATCH_JERSEY, PROJECT_JERSEY, createMockDatabase } from "./data";
import {
  canSeeEntity,
  getEntityTimeline,
  getRoleTimeline,
  getThreadTimeline,
  resolveThread,
} from "./selectors-timeline";
import { auditToEvent } from "./timeline";
import type { ViewerScope } from "./visibility";

const db = createMockDatabase();

function scopeFor(role: ViewerScope["role"], orgId?: string): ViewerScope {
  const user = db.users.find((entry) => entry.role === role && (!orgId || entry.orgId === orgId));
  assert.ok(user, `No seeded ${role} persona`);
  return { userId: user._id, orgId: user.orgId, role: user.role };
}

const admin = scopeFor("admin");

/* 1. Every audit entry in the seed narrates to a sentence, and no sentence
      leaks a table name or a snake_case action. */
const rawTableNames = /resourceBatches|productionBatches|resourceRequests|status_changed|quantity_moved/;
let narrated = 0;

for (const entry of db.auditLog) {
  const event = auditToEvent(db, entry, "admin");

  if (!event) {
    assert.equal(entry.action, "quantity_moved", `Dropped a non-movement entry: ${entry.action}`);
    continue;
  }

  narrated += 1;
  assert.ok(event.headline.length > 0, `Empty headline for ${entry.entityTable}/${entry.action}`);
  assert.ok(
    !rawTableNames.test(event.headline),
    `Raw database vocabulary in a headline: "${event.headline}"`,
  );
}

assert.ok(narrated > 20, `Only ${narrated} narrated events in the seed — expected the fixtures to be richer`);

/* 2. The jersey thread spans every stage of the model. */
const thread = resolveThread(db, { table: "resourceBatches", id: BATCH_JERSEY });
const tables = new Set(thread.map((ref) => ref.table));

for (const table of ["projects", "resourceRequests", "matches", "resourceBatches", "allocations"]) {
  assert.ok(tables.has(table), `Jersey thread is missing ${table}`);
}

/* 3. The thread timeline is non-empty and strictly newest-first. */
const adminThread = getThreadTimeline(db, admin, { table: "resourceBatches", id: BATCH_JERSEY });
assert.ok(adminThread.events.length > 5, "Jersey thread produced almost no events");

for (let index = 1; index < adminThread.events.length; index += 1) {
  assert.ok(
    adminThread.events[index - 1].occurredAt >= adminThread.events[index].occurredAt,
    "Thread events are out of chronological order",
  );
}

/* 4. The custody chain names real organisations in the order they held it:
      the jersey went manufacturer → custodian → maker and never doubles back. */
const custody = adminThread.custodyChain.map((entry) => entry.name);
assert.ok(
  custody.length >= 3,
  `Custody chain collapsed to ${custody.length} organisation(s): ${custody.join(" → ")}`,
);
assert.equal(
  new Set(custody).size,
  custody.length,
  `An organisation appears twice in the custody chain: ${custody.join(" → ")}`,
);

/* 5. A brand sees strictly less of its own thread than CIRKA does. */
const project = db.projects.find((row) => row._id === PROJECT_JERSEY);
assert.ok(project, "The jersey project is missing from the seed");

const brand = scopeFor("brand", project.brandOrgId);
const brandThread = getThreadTimeline(db, brand, { table: "projects", id: PROJECT_JERSEY });

assert.ok(
  brandThread.events.length < adminThread.events.length,
  `Brand saw ${brandThread.events.length} events and admin saw ${adminThread.events.length}: scoping is not removing anything`,
);
assert.ok(
  adminThread.hiddenFromBrand !== undefined && adminThread.hiddenFromBrand.count > 0,
  "Admin was not told how much of the thread the brand cannot see",
);
assert.equal(brandThread.hiddenFromBrand, undefined, "A brand must not be told what it cannot see");

/* 5b. A change to a protected field is withheld whole, not merely redacted:
       "updated estimated value" already leaks that a price exists and moved. */
const priced = {
  ...db,
  auditLog: [
    ...db.auditLog,
    {
      _id: "audit_check_price",
      entityTable: "resourceBatches",
      entityId: BATCH_JERSEY,
      action: "updated" as const,
      fieldChanges: [{ field: "estimatedValue", previousValue: "4000", newValue: "4600" }],
      actorOrgId: db.resourceBatches.find((row) => row._id === BATCH_JERSEY)!.ownerOrgId,
      actorType: "user" as const,
      occurredAt: Date.now(),
    },
  ],
};

const pricedForBrand = getThreadTimeline(priced, brand, { table: "projects", id: PROJECT_JERSEY });
assert.ok(
  !pricedForBrand.events.some((event) => event.id === "audit_check_price"),
  "A brand was shown a change to a protected field",
);

const owner = scopeFor("manufacturer", db.resourceBatches.find((row) => row._id === BATCH_JERSEY)!.ownerOrgId);
const pricedForOwner = getThreadTimeline(priced, owner, { table: "resourceBatches", id: BATCH_JERSEY });
assert.ok(
  pricedForOwner.events.some((event) => event.id === "audit_check_price"),
  "The owning organisation lost sight of its own price change",
);

/* 6. Nobody's own feed contains an event on a record they may not open. */
for (const role of ["manufacturer", "custodian", "maker", "brand"] as const) {
  const viewer = scopeFor(role);
  const feed = getRoleTimeline(db, viewer, { limit: 100 });

  assert.ok(feed.length > 0, `${role} has an empty activity feed`);

  for (const event of feed) {
    assert.ok(
      canSeeEntity(db, viewer, { table: event.entityTable, id: event.entityId }),
      `${role} feed leaked ${event.entityTable}/${event.entityId}`,
    );
  }
}

/* 7. Entity history is a subset of the thread it belongs to. */
const batchHistory = getEntityTimeline(db, admin, "resourceBatches", BATCH_JERSEY);
assert.ok(batchHistory.length > 0, "The jersey batch has no history of its own");
assert.ok(
  batchHistory.length <= adminThread.events.length,
  "A single record produced more events than its whole thread",
);

console.log(
  `timeline.check ✓  ${narrated} narrated · thread ${adminThread.events.length} (brand ${brandThread.events.length}, hidden ${adminThread.hiddenFromBrand?.count}) · custody ${adminThread.custodyChain.map((entry) => entry.name).join(" → ")}`,
);
