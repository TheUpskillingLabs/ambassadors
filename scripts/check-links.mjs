// The built site's links, checked after astro build: every internal link,
// image and script resolves to a file in dist; every #anchor exists on its
// page; and no live page links to a draft (a draft is built, but unlisted).
// Links off the site (OLOS at theupskillinglabs.org, the live site, Luma) aren't checked.
// The base path comes from BASE_PATH, as in the build.
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { routeStatus } from "./lib/meta.mjs";

const DIST = "dist";
const BASE = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
const ATTR = /\b(href|src|srcset|data-src|data-pin3d|data-art)="([^"]*)"/g;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

const status = await routeStatus();
const drafts = new Set([...status].filter(([, s]) => s === "draft").map(([r]) => r));
let problems = 0, links = 0;
const fail = (page, why) => { problems++; console.log(`${page}: ${why}`); };

for (const file of await walk(DIST)) {
  const html = await readFile(file, "utf8");
  const route = "/" + path.relative(DIST, file).split(path.sep).join("/").replace(/index\.html$/, "");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const live = status.get(route) === "live";
  for (const m of html.matchAll(ATTR)) {
    // Only a srcset is a list (split on a comma followed by space, so a data: URI's own comma stays put).
    if (/^data:/.test(m[2])) continue;
    for (const part of m[1] === "srcset" ? m[2].split(/,\s+/) : [m[2]]) {
      const ref = part.trim().split(/\s+/)[0];
      if (!ref) continue;
      if (ref.startsWith("#")) { if (ref.length > 1 && !ids.has(ref.slice(1))) fail(route, `anchor ${ref} has no element`); continue; }
      if (/^(https?:|mailto:|sms:|tel:|data:|javascript:)/.test(ref) || ref.startsWith("//")) continue;
      links++;
      const clean = ref.split(/[?#]/)[0];
      // A relative link resolves against the page's own directory: a route ending in / is that directory.
      const dir = route.endsWith("/") ? route : path.posix.dirname(route);
      let rel = clean.startsWith(BASE + "/") ? clean.slice(BASE.length) : clean.startsWith("/") ? null : path.posix.join(dir, clean);
      if (rel === null) { fail(route, `link outside the base path: ${ref}`); continue; }
      if (rel === "") rel = "/";
      const target = path.join(DIST, rel);
      const ok = (await exists(target)) && (rel.endsWith("/") ? await exists(path.join(target, "index.html")) : (await stat(target)).isFile() || (await exists(path.join(target, "index.html"))));
      if (!ok) { fail(route, `broken link: ${ref}`); continue; }
      const asRoute = rel.endsWith("/") ? rel : rel + "/";
      if (live && drafts.has(asRoute)) fail(route, `a live page links to a draft: ${ref}`);
    }
  }
}
if (problems) { console.error(`\n${problems} link issue(s).`); process.exit(1); }
console.log(`links: ok (${links} internal links checked, ${drafts.size} draft route(s) unlinked)`);
