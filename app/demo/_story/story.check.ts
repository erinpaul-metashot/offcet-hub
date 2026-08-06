/**
 * Runs every script end to end.
 *
 * A script is code, and a script that throws on beat 19 in front of a client is
 * the failure this file exists to prevent. Every beat is replayed, every ledger
 * is re-totalled, and every route a beat points at is checked against the
 * routes that actually exist under `app/demo`.
 *
 *   npx tsx app/demo/_story/story.check.ts
 */

import assert from "node:assert";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { QUANTITY_BUCKETS } from "../_mock/domain";
import { STORY_SCRIPTS } from "./scripts";
import { runTo, startingDatabase } from "./runner";
import { flattenBeats } from "./types";

/** Every route under `app/demo`, with `[param]` segments left as wildcards. */
function demoRoutes(directory = join(process.cwd(), "app", "demo"), prefix = "/demo"): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(directory)) {
    if (entry === "page.tsx") {
      found.push(prefix);
      continue;
    }

    if (entry.startsWith("_") || !statSync(join(directory, entry)).isDirectory()) {
      continue;
    }

    found.push(...demoRoutes(join(directory, entry), `${prefix}/${entry}`));
  }

  return found;
}

const ROUTES = demoRoutes();

function routeExists(route: string): boolean {
  const parts = route.split("?")[0].split("/");

  return ROUTES.some((candidate) => {
    const known = candidate.split("/");

    return (
      known.length === parts.length &&
      known.every((segment, index) => segment.startsWith("[") || segment === parts[index])
    );
  });
}

let beatCount = 0;

for (const script of STORY_SCRIPTS) {
  const beats = flattenBeats(script);
  assert.ok(beats.length > 0, `${script.id} has no beats.`);
  beatCount += beats.length;

  // 1. Ids are unique, so the dock can key off them and a link can name one.
  const ids = beats.map((entry) => `${entry.act.id}/${entry.beat.id}`);
  assert.equal(new Set(ids).size, ids.length, `${script.id} has duplicate beat ids.`);

  // 2. Beats run forward in time. A story that jumps backwards reads as a bug.
  const dated = beats.map((entry) => entry.beat.at).filter((at): at is number => at !== undefined);
  for (let index = 1; index < dated.length; index += 1) {
    assert.ok(
      dated[index] >= dated[index - 1],
      `${script.id}: beat ${index} is dated before the one before it.`,
    );
  }

  // 3. The whole script replays without a rule violation.
  const final = runTo(script, beats.length - 1);
  assert.equal(final.error, undefined, `${script.id} threw: ${final.error}`);

  // 4. Every ledger still balances afterwards.
  for (const batch of final.db.resourceBatches) {
    const total = QUANTITY_BUCKETS.reduce((sum, bucket) => sum + batch.pots[bucket], 0);
    assert.ok(
      Math.abs(total - batch.quantityOriginal) < 0.001,
      `${script.id}: ${batch.name} totals ${total} against an original of ${batch.quantityOriginal}.`,
    );
  }

  // 5. Every script actually changed something. A read-only script is a slideshow.
  const before = startingDatabase(script);
  assert.notEqual(
    final.db.auditLog.length,
    before.auditLog.length,
    `${script.id} wrote nothing to the record.`,
  );

  // 6. Every route a beat points at exists, including ids minted mid-story.
  for (const entry of beats) {
    const { route } = entry.beat;
    if (!route) continue;

    const resolved =
      typeof route === "string"
        ? route
        : route({ ids: final.ids, remember: () => {}, recall: (key) => final.ids[key] ?? "missing" });

    assert.ok(routeExists(resolved), `${script.id}/${entry.beat.id} points at ${resolved}, which has no page.`);
  }

  // 7. Stepping to any single beat works: the dock lets a viewer jump to an act.
  for (const entry of beats) {
    const state = runTo(script, entry.index);
    assert.equal(
      state.error,
      undefined,
      `${script.id}: jumping to "${entry.beat.title}" threw: ${state.error}`,
    );
  }
}

console.log(
  `story.check ✓  ${STORY_SCRIPTS.length} scripts · ${beatCount} beats · ${ROUTES.length} demo routes`,
);
