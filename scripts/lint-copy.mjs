// Voice check for everything in content/: flags the brand's banned words and
// patterns so edits made in GitHub's web editor get caught on build.
// Places that name a banned word on purpose (to say "don't") are allowlisted.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const RULES = [
  [/\b(course|courses|class|classes|student|students|lesson|lessons|module|modules)\b/i, "banned word (see Language)"],
  [/\bTUL\b/, 'say "The Labs", never "TUL"'],
  [/!(?!\[)/, "no exclamation points"],
  [/civic problems?/i, 'don\'t describe the work as "civic problems"'],
  [/\b(sign up|get started)\b/i, 'CTA is "Join The Labs"'],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji"],
];
// Files (or JSON keys) that quote banned words in order to forbid them.
const ALLOW_FILES = new Set(["content/pages/know-the-labs/common-questions.md", "content/site/ui.en.json"]);
const ALLOW_KEYS = new Set(["dont", "$comment"]);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(md|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

function strings(value, key, out) {
  if (typeof value === "string") { if (!ALLOW_KEYS.has(key)) out.push([key, value]); }
  else if (Array.isArray(value)) value.forEach((v) => strings(v, key, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, k, out);
  return out;
}

let problems = 0;
for (const file of [...(await walk("content")), "data/schedule.json"]) {
  if (ALLOW_FILES.has(file)) continue;
  const text = await readFile(file, "utf8");
  const chunks = file.endsWith(".json")
    ? strings(JSON.parse(text), "", [])
    : text.split("\n").map((l, i) => [`line ${i + 1}`, l]);
  for (const [where, s] of chunks) {
    for (const [re, why] of RULES) {
      if (re.test(s)) { problems++; console.log(`${file} (${where}): ${why}\n    ${s.trim().slice(0, 140)}`); }
    }
  }
}
if (problems) { console.error(`\n${problems} copy issue(s).`); process.exit(1); }
console.log("copy: ok");
