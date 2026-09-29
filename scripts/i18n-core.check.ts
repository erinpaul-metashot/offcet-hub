/**
 * Self-check for the translation helpers.
 *
 *   npx tsx scripts/i18n-core.check.ts
 */

import assert from "node:assert";
import { flatten, keepEdges, onlyTokens, protect, rebreak, restoreTokens, unflatten, verify, type Glossary } from "./i18n-core";

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

// a translator dropping a bracket is still restored; a token-only string needs no translator
assert.strictEqual(restoreTokens("[0]]", ["Đơn vị lưu giữ"]), "Đơn vị lưu giữ");
assert.ok(onlyTokens(protect("Custodian", glossary).text));
assert.ok(!onlyTokens(protect("Custodian site", glossary).text));
assert.ok(verify({ a: "X" }, { a: "[0]]" }).errors.length > 0);
assert.ok(verify({ a: "Target: {date}" }, { a: "Mục tiêu: []{date}" }).errors.length > 0);

// "[+0]" is restored; concatenated fragments keep their edge spaces
assert.strictEqual(restoreTokens("· [+0] đã nhận", ["{quantity}"]), "· {quantity} đã nhận");
assert.strictEqual(restoreTokens("ID: []0]", ["{id}"]), "ID: {id}");
assert.strictEqual(restoreTokens("Dự kiến \u200b\u200bđến", []), "Dự kiến đến");
assert.ok(verify({ a: "X" }, { a: "Y\u200b" }).errors.length > 0);
assert.strictEqual(restoreTokens("cột []0", ["{count}"]), "cột {count}");
assert.strictEqual(keepEdges(" · {n} received", "· {n} đã nhận"), " · {n} đã nhận");

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

// the "·" separator survives when Google swaps it for a bullet
assert.strictEqual(restoreTokens("[[0]] • bao gồm ước tính", ["{count}"]), "{count} · bao gồm ước tính");

console.log("i18n-core: all checks passed");
