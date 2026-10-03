// The governed content: every public page and record, with its `meta`
// (src/content.config.ts), read straight from the JSON so the checks can run
// before and after the build without Astro.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const PAGE_FILES = ["home", "joinpage", "partners", "government", "enterprise", "contributing", "workshops", "build-cycles", "labs"].map((f) => `content/site/${f}.json`);
export const RECORD_DIRS = ["content/labs", "content/events", "content/cycles"];

async function jsonFiles(dir) {
  return (await readdir(dir)).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
}

/** Every governed file: { file, kind: "page" | "record", data }. */
export async function governed() {
  const roles = (await jsonFiles("content/roles")).filter((f) => !f.endsWith("/roles.json"));
  const pages = [...PAGE_FILES, ...roles].map((file) => ({ file, kind: "page" }));
  const records = [];
  for (const dir of RECORD_DIRS) for (const file of await jsonFiles(dir)) records.push({ file, kind: "record" });
  const out = [];
  for (const g of [...pages, ...records]) out.push({ ...g, data: JSON.parse(await readFile(g.file, "utf8")) });
  return out;
}

/** route → status, for every public page. */
export async function routeStatus() {
  const map = new Map();
  for (const g of await governed()) if (g.kind === "page" && g.data.meta?.route) map.set(g.data.meta.route, g.data.meta.status);
  return map;
}

/** Every string in a JSON value, except $comment and keys that quote banned words on purpose. */
export function strings(value, key = "", out = []) {
  if (typeof value === "string") { if (key !== "$comment") out.push([key, value]); }
  else if (Array.isArray(value)) value.forEach((v) => strings(v, key, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, k, out);
  return out;
}
