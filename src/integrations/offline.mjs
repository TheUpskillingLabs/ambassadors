// Writes dist/sw.js after the build with a precache list of every emitted
// page and asset, so the guide, refreshers and the deck work offline after
// the first visit. The cache name carries a hash of the file list + build
// time, so each deploy replaces the previous cache cleanly.
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

// Large or non-essential files are cached on first use instead of up front.
const SKIP = [/^sw\.js$/, /^icons\/icon-512\.png$/, /\.map$/];
// Only the latin subset of the font is precached; other subsets load on demand.
const FONT_OK = /geologica-latin-wght-normal/;

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
        const urls = [];
        for (const f of files) {
          if (SKIP.some((re) => re.test(f))) continue;
          if (f.endsWith(".woff2") && !FONT_OK.test(f)) continue;
          if (f.endsWith(".woff")) continue;
          if (f === "index.html") urls.push(base + "/");
          else if (f.endsWith("/index.html")) urls.push(base + "/" + f.slice(0, -"index.html".length));
          else urls.push(base + "/" + f);
        }
        urls.sort();
        const hash = createHash("sha256").update(urls.join("\n") + Date.now()).digest("hex").slice(0, 10);
        const template = await readFile(new URL("../../scripts/sw-template.js", import.meta.url), "utf8");
        const sw = template
          .replace("__CACHE_NAME__", `guide-${hash}`)
          .replace("__PRECACHE__", JSON.stringify(urls, null, 0))
          .replace("__BASE__", base);
        await writeFile(path.join(root, "sw.js"), sw);
        let bytes = 0;
        for (const u of urls) {
          const rel = u.slice(base.length);
          const f = rel.endsWith("/") ? rel + "index.html" : rel;
          bytes += (await stat(path.join(root, f))).size;
        }
        logger.info(`sw.js: precaching ${urls.length} files (${Math.round(bytes / 1024)} KB)`);
      },
    },
  };
}
