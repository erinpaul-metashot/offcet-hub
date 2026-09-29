/**
 * Syncs one message file with its Google Sheet tab and machine-translates what changed.
 *
 *   npx tsx scripts/i18n-translate.ts landing
 *
 * The tab `<name>` in sheet `I18N_SHEET_ID` holds every key:
 *   A key · B English · C Vietnamese (the reviewer edits this) · D machine input
 *
 * Each run:
 *   1. pulls reviewer edits from column C for keys whose English is unchanged;
 *   2. sends new/changed English through `GOOGLETRANSLATE()` (free, no billing),
 *      with placeholders, line breaks, names and glossary terms protected;
 *   3. verifies the result and writes `<name>.vi.json` only if nothing is broken;
 *   4. writes every row back to the sheet as plain values for review.
 *
 * Needs in `.env.local`: GOOGLE_APPLICATION_CREDENTIALS (service-account key path,
 * kept out of git) and I18N_SHEET_ID. The sheet must be shared with the service
 * account's email as Editor.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { GoogleAuth } from "google-auth-library";
import { flatten, keepEdges, onlyTokens, protect, rebreak, restoreTokens, unflatten, verify, type Flat, type Glossary, type Json } from "./i18n-core";

const ROOT = process.cwd();
const MESSAGES = join(ROOT, "lib", "i18n", "messages");
const CACHE_PATH = join(ROOT, "lib", "i18n", "translation-cache.json");
const GLOSSARY_PATH = join(ROOT, "lib", "i18n", "glossary.json");
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const POLL_MS = 2_000;
const POLL_LIMIT_MS = 120_000;

/** Per message file: the English each VI value was made from, and the VI last published to the sheet. */
type Cache = Record<string, { en: Flat; vi: Flat }>;

const readJson = <T>(path: string, fallback: T): T =>
  existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
const writeJson = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local (see the header of this script).`);
  }
  return value;
}

/** Stops Sheets reading user text as a formula. */
const asText = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);

async function sheetsClient() {
  const keyFile = requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const sheetId = requireEnv("I18N_SHEET_ID");
  const auth = new GoogleAuth({ keyFile, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const client = await auth.getClient();
  const email = (await auth.getCredentials()).client_email;

  const call = async <T>(path: string, method: "GET" | "POST" | "PUT" = "GET", data?: unknown): Promise<T> => {
    try {
      const response = await client.request<T>({ url: `${SHEETS}/${sheetId}${path}`, method, data });
      return response.data;
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { error?: { message?: string } } } }).response;
      const status = response?.status;
      if (status === 403 || status === 404) {
        const reason = response?.data?.error?.message ?? "no details";
        throw new Error(
          `Sheets refused access (${status}): ${reason}\nIf it is a sharing problem, share the sheet with ${email} as Editor and check I18N_SHEET_ID.`,
        );
      }
      throw error;
    }
  };
  return call;
}

type Call = Awaited<ReturnType<typeof sheetsClient>>;
const range = (tab: string, cells: string) => encodeURIComponent(`'${tab}'!${cells}`);

async function ensureTab(call: Call, tab: string) {
  const meta = await call<{ sheets: { properties: { title: string } }[] }>("?fields=sheets.properties.title");
  if (!meta.sheets.some((sheet) => sheet.properties.title === tab)) {
    await call(":batchUpdate", "POST", { requests: [{ addSheet: { properties: { title: tab } } }] });
  }
}

async function readRows(call: Call, tab: string, cells: string): Promise<string[][]> {
  const result = await call<{ values?: string[][] }>(`/values/${range(tab, cells)}`);
  return result.values ?? [];
}

async function writeRows(call: Call, tab: string, rows: string[][]) {
  await call(`/values/${range(tab, "A:E")}:clear`, "POST", {});
  await call(`/values/${range(tab, "A1")}?valueInputOption=USER_ENTERED`, "PUT", { values: rows });
}

async function machineTranslate(call: Call, tab: string, inputs: string[]): Promise<string[]> {
  // Scratch rows below the data would shift on the next run, so use columns F:G.
  await call(`/values/${range(tab, "F:G")}:clear`, "POST", {});
  const rows = inputs.map((text, i) => [asText(text), `=GOOGLETRANSLATE(F${i + 1},"en","vi")`]);
  await call(`/values/${range(tab, "F1")}?valueInputOption=USER_ENTERED`, "PUT", { values: rows });

  const deadline = Date.now() + POLL_LIMIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const results = (await readRows(call, tab, `G1:G${inputs.length}`)).map((row) => row[0] ?? "");
    const done = results.length === inputs.length && results.every((value) => value && value !== "Loading...");
    if (done) {
      const failed = results.findIndex((value) => value.startsWith("#"));
      if (failed >= 0) {
        throw new Error(`GOOGLETRANSLATE failed on "${inputs[failed]}": ${results[failed]}. Wait a minute and re-run.`);
      }
      await call(`/values/${range(tab, "F:G")}:clear`, "POST", {});
      return results;
    }
  }
  throw new Error("GOOGLETRANSLATE did not finish within 2 minutes. Re-run; finished rows are not lost.");
}

async function main() {
  const name = process.argv[2];
  if (!name || !/^[\w-]+$/.test(name)) {
    throw new Error("Usage: npx tsx scripts/i18n-translate.ts <message-file-name>   e.g. landing");
  }
  loadEnvConfig(ROOT);

  const enPath = join(MESSAGES, `${name}.en.json`);
  const viPath = join(MESSAGES, `${name}.vi.json`);
  const shape = readJson<Json | null>(enPath, null);
  if (!shape) {
    throw new Error(`${enPath} not found.`);
  }
  const en = flatten(shape);
  const glossary = readJson<Glossary>(GLOSSARY_PATH, { doNotTranslate: [], terms: {} });
  const cache = readJson<Cache>(CACHE_PATH, {});
  const vi: Flat = { ...flatten(readJson<Json>(viPath, {})) };
  const madeFrom = cache[name]?.en ?? {};
  // What the sheet showed after the last run. A cell that still matches it was not
  // edited in the sheet, so a local edit to `<name>.vi.json` is kept.
  const published = cache[name]?.vi ?? {};

  const call = await sheetsClient();
  await ensureTab(call, name);

  // 1. Reviewer edits: column C wins for any key whose English hasn't changed.
  const pending = Object.keys(en).filter((key) => madeFrom[key] !== en[key]);
  const reviewed = new Map((await readRows(call, name, "A2:C")).map(([key, , value]) => [key, value]));
  let pulled = 0;
  for (const key of Object.keys(en)) {
    const edit = reviewed.get(key);
    if (!pending.includes(key) && edit && edit !== (published[key] ?? vi[key]) && edit !== vi[key]) {
      vi[key] = edit;
      pulled += 1;
    }
  }

  // 2. Machine-translate new or changed English.
  if (pending.length > 0) {
    const guarded = pending.map((key) => protect(en[key], glossary));
    const needsMachine = guarded.filter((g) => !onlyTokens(g.text));
    const machine = needsMachine.length > 0 ? await machineTranslate(call, name, needsMachine.map((g) => g.text)) : [];
    const translated = guarded.map((g) => (onlyTokens(g.text) ? g.text : (machine.shift() as string)));
    pending.forEach((key, i) => {
      const breaks = en[key].split("\n").length - 1;
      vi[key] = keepEdges(en[key], rebreak(restoreTokens(translated[i], guarded[i].restore), breaks));
    });
  }

  // 3. Verify before anything is written.
  const { errors, warnings } = verify(en, Object.fromEntries(Object.keys(en).map((key) => [key, vi[key]])));
  warnings.forEach((warning) => console.warn(`warn  ${warning}`));
  if (errors.length > 0) {
    errors.forEach((error) => console.error(`error ${error}`));
    throw new Error(`${errors.length} problem(s); ${name}.vi.json was not changed. Fix column C in the sheet and re-run.`);
  }

  writeJson(viPath, unflatten(shape, vi));
  writeJson(CACHE_PATH, { ...cache, [name]: { en, vi } });

  // 4. Publish every row for review. Column E translates the Vietnamese back to
  //    English and recalculates on every edit: meaning drift is visible without
  //    reading Vietnamese.
  const rows = [
    ["key", "English", "Vietnamese (edit this column)", "machine input", "back-translation (check)"],
    ...Object.keys(en).map((key, i) => [
      key,
      asText(en[key]),
      asText(vi[key]),
      asText(protect(en[key], glossary).text),
      `=GOOGLETRANSLATE(C${i + 2},"vi","en")`,
    ]),
  ];
  await writeRows(call, name, rows);

  console.log(
    `${name}: ${pending.length} machine-translated, ${pulled} reviewer edit(s) pulled, ${warnings.length} warning(s). Wrote ${name}.vi.json.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
