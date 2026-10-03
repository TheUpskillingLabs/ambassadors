// Writes dist/sw.js after the build with a precache list of the account's
// pages (the ambassador guide, its steps, the deck, the apply flow) and the
// styles, scripts, fonts and small images they load, so an ambassador's guide
// and deck work on a phone in a room after the first visit. The public site
// isn't precached: it's big, and it's cached as you use it. The cache name
// carries a hash of the file list + build time, so each deploy replaces the
// previous cache cleanly.
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

// The pages to precache: everything inside the account except the coordinator's unlisted invite page.
const PAGE = /^account\/(?!invite\/).*index\.html$/;
// Only the latin subset of the font is precached; other subsets load on demand.
const FONT_OK = /geologica-latin-wght-normal/;
// What a page loads, as far as its markup says: styles, scripts, images, the icons and the manifest.
const REF = /(?:href|src|srcset|data-pin3d|data-art)="([^"]+)"/g;

export default function offline() {
  let base = "";
  return {
    name: "ambassador-guide-offline",
    hooks: {
      "astro:config:done": ({ config }) => {
        base = config.base.replace(/\/+$/, "");
      },
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await walk(root)).map((f) => path.relative(root, f).split(path.sep).join("/"));
        const have = new Set(files);
        const urls = new Set();
        const pages = files.filter((f) => PAGE.test(f));
        for (const f of pages) {
          urls.add(base + "/" + f.slice(0, -"index.html".length));
          const html = await readFile(path.join(root, f), "utf8");
          for (const m of html.matchAll(REF)) {
            for (const part of m[1].split(",")) {
              const ref = part.trim().split(/\s+/)[0];
              if (!ref || /^(https?:|data:|#|mailto:|sms:|tel:)/.test(ref)) continue;
              let rel = ref.startsWith(base + "/") ? ref.slice(base.length + 1) : ref.startsWith("/") ? ref.slice(1) : null;
              if (!rel) continue;
              rel = rel.split(/[?#]/)[0];
              if (!have.has(rel) || rel.endsWith(".html")) continue;
              if (/\.(mp4|webm|woff)$/.test(rel) || (rel.endsWith(".woff2") && !FONT_OK.test(rel))) continue;
              if (/\.(png|jpe?g|webp)$/.test(rel) && (await stat(path.join(root, rel))).size > 400 * 1024) continue;
              urls.add(base + "/" + rel);
            }
          }
        }
        for (const f of ["manifest.webmanifest", "favicon.png", "icons/icon-192.png"]) if (have.has(f)) urls.add(base + "/" + f);
        const list = [...urls].sort();
        const hash = createHash("sha256").update(list.join("\n") + Date.now()).digest("hex").slice(0, 10);
        const template = await readFile(new URL("../../scripts/sw-template.js", import.meta.url), "utf8");
        const sw = template
          .replace("__CACHE_NAME__", `guide-${hash}`)
          .replace("__PRECACHE__", JSON.stringify(list, null, 0))
          .replace("__BASE__", base);
        await writeFile(path.join(root, "sw.js"), sw);
        let bytes = 0;
        for (const u of list) {
          const rel = u.slice(base.length + 1);
          const f = rel.endsWith("/") ? rel + "index.html" : rel;
          bytes += (await stat(path.join(root, f))).size;
        }
        logger.info(`sw.js: precaching ${list.length} files (${Math.round(bytes / 1024)} KB) for ${pages.length} account pages`);
      },
    },
  };
}
