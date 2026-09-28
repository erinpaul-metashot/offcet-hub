/**
 * Runnable check for the fresh-slate database.
 *
 *     npx tsx app/demo/_mock/fresh.check.ts
 *
 * A fresh slate must keep the five personas approved, hold no transactional
 * rows, balance its (empty) ledger, render every role dashboard, and let a
 * brand-new user record a batch and open a brief.
 */

import assert from "node:assert";
import { createFreshDatabase } from "./data";
import { checkLedgerIntegrity } from "./ledger";
import { createResourceBatch } from "./operations/batches";
import { createProject, createResourceRequest } from "./operations/demand";
import { getAdminDashboard } from "./selectors-admin";
import { getBrandDashboard } from "./selectors-brand";
import { getCustodianDashboard } from "./selectors-custodian";
import { getMakerDashboard } from "./selectors-maker";
import { getManufacturerDashboard } from "./selectors-manufacturer";
import type { MockDatabase } from "./types";
import type { ViewerScope } from "./visibility";

const db = createFreshDatabase();

/* 1. Five approved personas, one org each, nothing transactional. */
assert.strictEqual(db.users.length, 5);
assert.ok(db.users.every((user) => user.status === "approved"));
assert.ok(db.organisations.every((org) => org.status === "approved"));
assert.ok(db.users.every((user) => db.organisations.some((org) => org._id === user.orgId)));
const accountTables = new Set(["users", "organisations", "facilities"]);
for (const [table, rows] of Object.entries(db) as [keyof MockDatabase, unknown[]][]) {
  if (!accountTables.has(table)) assert.strictEqual(rows.length, 0, `${table} should be empty`);
}
assert.deepStrictEqual(checkLedgerIntegrity(db), []);

const scope = (role: string): ViewerScope => {
  const user = db.users.find((row) => row.role === role);
  assert.ok(user, `No ${role} persona`);
  return { userId: user._id, orgId: user.orgId, role: user.role };
};

/* 2. Every dashboard renders from nothing. */
getAdminDashboard(db);
getBrandDashboard(db, scope("brand"));
getCustodianDashboard(db, scope("custodian"));
getMakerDashboard(db, scope("maker"));
getManufacturerDashboard(db, scope("manufacturer"));

/* 3. A new manufacturer records a batch; a new brand opens a brief and a request. */
const withBatch = createResourceBatch(db, scope("manufacturer"), {
  name: "Cotton jersey offcuts",
  description: "Post-production offcuts.",
  materialCategory: "cotton_offcuts",
  quantity: 120,
  unit: "kg",
  dataSource: "manual_entry",
});
assert.strictEqual(withBatch.db.resourceBatches.length, 1);
assert.deepStrictEqual(checkLedgerIntegrity(withBatch.db), []);

const withProject = createProject(withBatch.db, scope("brand"), {
  title: "Jersey capsule",
  objective: "Test a capsule from offcuts.",
});
const withRequest = createResourceRequest(withProject.db, scope("brand"), {
  projectId: withProject.projectId,
  title: "Jersey for capsule",
  materialCategory: "cotton_offcuts",
  quantityNeeded: 100,
  unit: "kg",
});
assert.strictEqual(withRequest.db.resourceRequests.length, 1);
getBrandDashboard(withRequest.db, scope("brand"));
getManufacturerDashboard(withRequest.db, scope("manufacturer"));

console.log("fresh.check: ok");
