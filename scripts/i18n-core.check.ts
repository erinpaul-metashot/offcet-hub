/**
 * Self-check for the translation helpers.
 *
 *   npx tsx scripts/i18n-core.check.ts
 */

import assert from "node:assert";
import { flatten, protect, rebreak, restoreTokens, unflatten, verify, type Glossary } from "./i18n-core";

const glossary: Glossary = { doNotTranslate: ["CIRKA"], terms: { Custodian: "Đơn vị lưu giữ" } };

// flatten / unflatten round-trip, arrays included
const shape = { a: { b: ["x", "y"] }, c: "z" };
const flat = flatten(shape);
assert.deepStrictEqual(flat, { "a.b.0": "x", "a.b.1": "y", c: "z" });
assert.deepStrictEqual(unflatten(shape, flat), shape);
assert.throws(() => unflatten(shape, { c: "z" }), /a\.b\.0/);

// protect swaps placeholders, line breaks, names and glossary terms
const guarded = protect("© {year} CIRKA\nCustodian site", glossary);
assert.strictEqual(guarded.text, "© [[0]] [[1]][[2]][[3]] site");
assert.deepStrictEqual(guarded.restore, ["{year}", "CIRKA", "\n", "Đơn vị lưu giữ"]);

// restore tolerates spacing the translator added, and puts VI terms in
assert.strictEqual(
  restoreTokens("© [[ 0 ]] [[1]] [[2]] điểm [[3]]", guarded.restore),
  "© {year} CIRKA\nđiểm Đơn vị lưu giữ",
);

// rebreak restores a dropped line break at the most even word boundary
assert.strictEqual(rebreak("Tài nguyên thứ cấp", 1), "Tài nguyên\nthứ cấp");
assert.strictEqual(rebreak("Chính phủ & Hiệp hội thương mại", 2).split("\n").length, 3);
assert.strictEqual(rebreak("Một\nHai", 1), "Một\nHai");
assert.strictEqual(rebreak("Dữ liệu", 1), "Dữ\nliệu");

// verify catches each failure class
const en = { a: "Hi {name}", b: "One\nTwo", c: "Same" };
assert.deepStrictEqual(verify(en, { a: "Chào {name}", b: "Một\nHai", c: "Khác" }), { errors: [], warnings: [] });
const bad = verify(en, { a: "Chào", b: "Một Hai [[0]]", c: "Same", d: "extra" });
// placeholder lost, leftover token, line break lost, unknown key
assert.strictEqual(bad.errors.length, 4, bad.errors.join("\n"));
assert.strictEqual(bad.warnings.length, 1);
assert.ok(verify(en, { a: "Chào {name}", b: "Một\nHai" }).errors.some((e) => e.startsWith("c: missing")));

console.log("i18n-core: all checks passed");
