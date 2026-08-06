/**
 * Runnable check for the maker's project grouping.
 *
 *     npx tsx app/demo/_mock/maker-projects.check.ts
 *
 * Three things have to hold. A maker's portfolio must contain their own runs
 * and nothing else, every run must land in exactly one group (a run without a
 * brief goes to the unassigned bucket rather than disappearing), and the
 * material totals must be the sum of those runs.
 */

import assert from "node:assert";
import { createMockDatabase } from "./data";
import {
  UNASSIGNED_PROJECT,
  getMakerProjectDetail,
  listMakerProduction,
  listMakerProjects,
} from "./selectors-maker";

const db = createMockDatabase();
const maker = db.users.find((user) => user.role === "maker");
assert.ok(maker, "No seeded maker persona");

const runs = listMakerProduction(db, maker.orgId);
const rows = listMakerProjects(db, maker.orgId);

assert.ok(runs.length > 0, "The seed should give the maker something to have made");

/* 1. Only this maker's runs, and every one of them, exactly once. */
const grouped = rows.flatMap((row) => row.runs.map((entry) => entry.production._id));
assert.strictEqual(grouped.length, runs.length, "Grouping lost or duplicated a run");
assert.strictEqual(new Set(grouped).size, grouped.length, "A run appears in two groups");

for (const row of rows) {
  for (const entry of row.runs) {
    assert.strictEqual(
      entry.production.makerOrgId,
      maker.orgId,
      "Another maker's run leaked into the portfolio",
    );
  }
}

/* 2. A run with no brief behind it is still accounted for. */
const briefless = runs.filter(
  (entry) =>
    entry.production.projectId === undefined &&
    db.allocations.find((allocation) => allocation._id === entry.production.allocationId)
      ?.projectId === undefined,
);

const unassigned = rows.find((row) => row.key === UNASSIGNED_PROJECT);
assert.strictEqual(
  unassigned?.runs.length ?? 0,
  briefless.length,
  "Runs without a project brief were dropped instead of bucketed",
);
assert.strictEqual(unassigned?.project, undefined, "The unassigned bucket must not carry a project");

/* 3. Totals are the sum of the runs in the group, and yield follows the ledger. */
for (const row of rows) {
  const used = row.runs.reduce((total, entry) => total + (entry.production.qtyUsed ?? 0), 0);
  const incorporated = row.runs.reduce(
    (total, entry) => total + (entry.production.qtyIncorporated ?? 0),
    0,
  );

  assert.ok(Math.abs(row.material.used - used) < 0.001, `${row.title}: used total is wrong`);
  assert.ok(
    Math.abs(row.material.incorporated - incorporated) < 0.001,
    `${row.title}: incorporated total is wrong`,
  );
  assert.ok(
    row.material.incorporated <= row.material.used + 0.001,
    `${row.title}: more material incorporated than used`,
  );

  if (used > 0) {
    assert.ok(
      Math.abs((row.material.yield ?? 0) - incorporated / used) < 0.001,
      `${row.title}: yield does not match incorporated ÷ used`,
    );
  }
}

/* 4. The detail view exists for a real brief and refuses the unassigned bucket. */
const withProject = rows.find((row) => row.project);
assert.ok(withProject, "The seed should give the maker at least one project brief");
assert.ok(
  getMakerProjectDetail(db, maker.orgId, withProject.key),
  "Detail view missing for a project the maker worked on",
);
assert.strictEqual(
  getMakerProjectDetail(db, maker.orgId, UNASSIGNED_PROJECT),
  null,
  "The unassigned bucket must not resolve to a project page",
);

console.log(
  `maker-projects.check: ${rows.length} groups, ${runs.length} runs, ${
    unassigned?.runs.length ?? 0
  } without a brief — all good.`,
);
