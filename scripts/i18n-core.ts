/**
 * Pure helpers for the translation pipeline: no I/O, no network.
 * `i18n-core.check.ts` exercises every function here.
 */

export type Flat = Record<string, string>;
export type Json = string | Json[] | { [key: string]: Json };

export interface Glossary {
  /** Kept verbatim in every language (brand names, acronyms). */
  doNotTranslate: string[];
  /** Signed-off EN → VI term forms, applied after machine translation. */
  terms: Record<string, string>;
}

/** `{ a: { b: ["x"] } }` → `{ "a.b.0": "x" }` */
export function flatten(value: Json, prefix = ""): Flat {
  if (typeof value === "string") {
    return { [prefix]: value };
  }
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value);
  return Object.assign(
    {},
    ...entries.map(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key)),
  );
}

/** Rebuilds `shape` with every string replaced by `flat[path]`. */
export function unflatten(shape: Json, flat: Flat, prefix = ""): Json {
  if (typeof shape === "string") {
    const value = flat[prefix];
    if (value === undefined) {
      throw new Error(`No translation for "${prefix}".`);
    }
    return value;
  }
  const path = (key: string) => (prefix ? `${prefix}.${key}` : key);
  if (Array.isArray(shape)) {
    return shape.map((child, i) => unflatten(child, flat, path(String(i))));
  }
  return Object.fromEntries(Object.entries(shape).map(([key, child]) => [key, unflatten(child, flat, path(key))]));
}

export interface Protected {
  text: string;
  /** Token index → what goes back in its place. */
  restore: string[];
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Swaps everything machine translation must not touch for `[[n]]` tokens:
 * `{placeholders}`, line breaks, do-not-translate names, and glossary terms
 * (which come back as their signed-off Vietnamese form).
 */
export function protect(text: string, glossary: Glossary): Protected {
  const restore: string[] = [];
  const fixed = [
    ...glossary.doNotTranslate.map((term) => [term, term] as const),
    ...Object.entries(glossary.terms),
  ].sort(([a], [b]) => b.length - a.length);

  const alternatives = [
    "\\{\\w+\\}",
    "\\n",
    ...fixed.map(([term]) => `\\b${escapeRegex(term)}\\b`),
  ];
  const pattern = new RegExp(alternatives.join("|"), "g");
  const replacement = new Map<string, string>(fixed.map(([en, out]) => [en, out]));

  const out = text.replace(pattern, (match) => {
    restore.push(replacement.get(match) ?? match);
    return `[[${restore.length - 1}]]`;
  });
  return { text: out, restore };
}

/** Puts tokens back. Translators sometimes add spaces inside or around them. */
export function restoreTokens(translated: string, restore: string[]): string {
  return translated
    .replace(/\s*\[\[\s*(\d+)\s*\]\]\s*/g, (match, index: string) => {
      const value = restore[Number(index)];
      if (value === undefined) {
        return match;
      }
      if (value === "\n") {
        return "\n";
      }
      const lead = /^\s/.test(match) ? " " : "";
      const trail = /\s$/.test(match) ? " " : "";
      return `${lead}${value}${trail}`;
    })
    .replace(/ *\n */g, "\n")
    .trim();
}

/**
 * Machine translation often drops line-break tokens in short labels
 * ("Secondary\nResources"). When the count is off, re-break the translation into
 * the same number of lines, as evenly as whole words allow. A reviewer can move
 * the break in the sheet.
 */
export function rebreak(text: string, breaks: number): string {
  const current = (text.match(/\n/g) ?? []).length;
  if (current === breaks) {
    return text;
  }
  const words = text.replace(/\s*\n\s*/g, " ").split(" ").filter(Boolean);
  const lines = Math.min(breaks + 1, words.length);
  const target = words.join(" ").length / lines;
  const out: string[][] = [[]];
  for (const word of words) {
    const line = out[out.length - 1];
    const length = line.join(" ").length;
    const wordsLeft = words.length - out.flat().length;
    const linesLeft = lines - out.length;
    if (line.length > 0 && linesLeft > 0 && (length + word.length / 2 > target || wordsLeft <= linesLeft)) {
      out.push([word]);
    } else {
      line.push(word);
    }
  }
  return out.map((line) => line.join(" ")).join("\n");
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
const lineBreaks = (text: string) => (text.match(/\n/g) ?? []).length;

export interface Verdict {
  errors: string[];
  warnings: string[];
}

/** Everything a machine or a reviewer can get wrong that a script can detect. */
export function verify(en: Flat, vi: Flat): Verdict {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of Object.keys(en)) {
    const source = en[key];
    const target = vi[key];
    if (target === undefined) {
      errors.push(`${key}: missing`);
      continue;
    }
    if (!target.trim()) {
      errors.push(`${key}: empty`);
    }
    if (/\[\[\s*\d+\s*\]\]/.test(target)) {
      errors.push(`${key}: leftover token in "${target}"`);
    }
    if (placeholders(source) !== placeholders(target)) {
      errors.push(`${key}: placeholders differ ("${source}" vs "${target}")`);
    }
    if (lineBreaks(source) !== lineBreaks(target)) {
      errors.push(`${key}: line breaks differ (${lineBreaks(source)} vs ${lineBreaks(target)})`);
    }
    if (source === target) {
      warnings.push(`${key}: identical to English ("${source}")`);
    }
  }
  for (const key of Object.keys(vi)) {
    if (!(key in en)) {
      errors.push(`${key}: not in English`);
    }
  }
  return { errors, warnings };
}
