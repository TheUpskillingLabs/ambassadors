// Governance, enforced on every build (before astro build): every public page
// and record carries `meta` (src/content.config.ts checks its shape); here,
// the rules that need a clock or the whole set:
//  - a review date that has passed fails the build (someone has to look again);
//  - a live page carries no placeholder markers ([PLACEHOLDER], [N], a whole string in brackets);
//  - a draft page is never listed as live elsewhere (routes are unique);
//  - no one is shown without consent: a live person or story carries a consent
//    record, so does each of a live project's team members, and a problem's
//    owner is named only with one.
// Run with CHECK_DATE=YYYY-MM-DD to pretend it's another day.
import { governed, strings } from "./lib/meta.mjs";

const today = process.env.CHECK_DATE || new Date().toISOString().slice(0, 10);
let problems = 0;
const fail = (file, why) => { problems++; console.log(`${file}: ${why}`); };
const routes = new Map();
for (const { file, kind, data } of await governed()) {
  const m = data.meta;
  if (!m) { fail(file, "no meta (route, need, owner, review, status)"); continue; }
  if (m.review < today) fail(file, `review date ${m.review} has passed: check the page, then set the next review`);
  if (kind === "record" && m.status === "live") {
    const ok = (c) => c && c.who && c.to && c.on;
    if (file.startsWith("content/people/") && !ok(data.consent)) fail(file, "a live person without a consent record (who, to, on)");
    if (file.startsWith("content/stories/") && !ok(data.consent)) fail(file, "a live story without a consent record (who, to, on)");
    if (file.startsWith("content/projects/")) for (const t of data.team ?? []) if (!ok(t.consent)) fail(file, `team member "${t.name}" named without a consent record`);
    if (file.startsWith("content/problems/") && data.owner && !ok(data.owner.consent)) fail(file, `problem owner "${data.owner.name}" named without a consent record`);
  }
  if (kind === "page") {
    if (routes.has(m.route)) fail(file, `route ${m.route} is also ${routes.get(m.route)}`);
    routes.set(m.route, file);
    if (m.status === "live") {
      for (const [key, s] of strings(data)) if (/\[PLACEHOLDER\]|\[N\]|^\[[^\]]+\]$/.test(s)) fail(file, `live page with a placeholder marker (${key}): ${s.slice(0, 80)}`);
    }
  }
}
if (problems) { console.error(`\n${problems} governance issue(s).`); process.exit(1); }
console.log(`meta: ok (${routes.size} pages, as of ${today})`);
