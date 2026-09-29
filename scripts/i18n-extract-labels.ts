/**
 * Copies the English domain vocabulary out of `app/demo/_mock/domain.ts` into
 * `lib/i18n/messages/demo-labels.en.json`, so the translation pipeline can see it.
 * `domain.ts` stays the source of truth; re-run this after changing a label there.
 *
 *   npx tsx scripts/i18n-extract-labels.ts && npm run i18n:translate demo-labels
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as domain from "../app/demo/_mock/domain";

const isLabelMap = (value: unknown): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

const maps = Object.fromEntries(
  Object.entries(domain)
    .filter(([name, value]) => /_(LABELS|DESCRIPTIONS)$/.test(name) && isLabelMap(value))
    .sort(([a], [b]) => a.localeCompare(b)),
);

const path = join(process.cwd(), "lib", "i18n", "messages", "demo-labels.en.json");
writeFileSync(path, `${JSON.stringify(maps, null, 2)}\n`);
console.log(`Wrote ${Object.keys(maps).length} label maps to ${path}`);
