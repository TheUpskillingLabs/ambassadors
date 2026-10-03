/* Content schemas — the contract every content file is validated against at
   build time. Copy lives in /content (Markdown + JSON), never in components.

   Every public page and every record carries governance (`meta`): the need
   it meets, who owns it, when it's next reviewed, its status, where its
   facts come from. scripts/check-meta.mjs enforces the rules on top of these
   shapes (a review date that has passed fails the build; a draft is never
   linked from a live page; a live page carries no placeholder markers), and
   scripts/check-links.mjs checks the built site's links.

   STABILITY: the `scenarios` schema is read by the planned prospect game.
   Add optional fields only; never rename or remove one. */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Every entry can be flagged as draft copy. Rendered as a visible
 *  [PLACEHOLDER] marker until real Labs copy is dropped in. */
const placeholder = z.boolean().default(false);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
/** Who answers for a page or record: a role, never a person. */
const owner = z.enum(["national", "lab", "contributors"]);
/** live: linked and shown. draft: built, but unlinked and unlisted. withdrawn: kept with a notice, out of the menus. */
const status = z.enum(["live", "draft", "withdrawn"]);

/** Governance for a public page. */
const pageMeta = z.object({
  /** The page's address, so the checks can tell which built page this is. */
  route: z.string().regex(/^\/([a-z0-9-]+\/)*$/),
  /** "As a…, I need…, so that…" */
  need: z.string().min(20),
  owner,
  review: isoDate,
  status,
  /** Let search engines index it, once it's on production. Off for every page on the staging build. */
  index: z.boolean().default(false),
});

/** Governance for a record (an event, a Lab, a cycle): where its facts come from, and when they were last checked. */
const recordMeta = z.object({
  owner,
  review: isoDate,
  status: status.default("live"),
  /** Where the facts came from (the platform, the live site, a person), with the date they were taken. */
  source: z.string().min(3),
});

/** The public pages whose copy is one JSON file each (content/site). The
 *  shape of each page's copy is its own; the collection checks the governance. */
const pages = defineCollection({
  loader: glob({ pattern: ["home.json", "joinpage.json", "partners.json", "government.json", "enterprise.json", "contributing.json", "workshops.json", "build-cycles.json", "labs.json"], base: "./content/site" }),
  schema: z.object({ placeholder, meta: pageMeta, title: z.string(), description: z.string() }).loose(),
});

/** The role pages (content/roles/<slug>.json; roles.json is the list). */
const roles = defineCollection({
  loader: glob({ pattern: ["*.json", "!roles.json"], base: "./content/roles" }),
  schema: z.object({ placeholder, meta: pageMeta, slug: z.string(), role: z.string(), description: z.string() }).loose(),
});

/** A Lab: a city's Lab, at whatever stage it's at. One file per Lab (content/labs). */
const labs = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/labs" }),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    region: z.string().length(2),
    /** list: names gathering. forming: a local lead and a library in sight. first-workshops, first-cycle, chartered: as they say. active: running. */
    stage: z.enum(["list", "forming", "first-workshops", "first-cycle", "active", "chartered"]),
    library: z.string().optional(),
    members: z.number().int().nonnegative().optional(),
    /** For a Lab still on the list: how many have put their names down. Shown only above a threshold (never a zero). */
    waiting: z.number().int().nonnegative().optional(),
    rhythm: z.array(z.string()).default([]),
    meta: recordMeta,
  }),
});

/** An event: a dated session at a Lab or online (content/events/<date>-<slug>.json). */
const events = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/events" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["workshop", "anchor", "open-house", "coworking", "social"]),
    date: isoDate,
    /** Local to the venue, HH:MM; with `tz` an IANA zone. */
    time: z.string().regex(/^\d{2}:\d{2}$/),
    tz: z.string().default("America/New_York"),
    /** The Lab it belongs to (a labs id), or none for online. */
    lab: z.string().optional(),
    online: z.boolean().default(false),
    place: z.string().optional(),
    /** The cycle it's an anchor event of (a cycles id). */
    cycle: z.string().optional(),
    /** Where to register (the live site or Luma). */
    href: z.url().optional(),
    summary: z.string().optional(),
    meta: recordMeta,
  }),
});

/** A Build Cycle: twelve weeks at a Lab (content/cycles/<lab>-<season>-<year>.json). */
const cycles = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/cycles" }),
  schema: z.object({
    title: z.string(),
    lab: z.string(),
    season: z.enum(["winter", "spring", "summer", "fall"]),
    year: z.number().int(),
    theme: z.string().optional(),
    kickoff: isoDate,
    showcase: isoDate,
    /** Applications close; the page switches from "applications open" to "underway" at this date (src/lib/dates.ts). */
    closes: isoDate,
    anchors: z.array(z.string()).default([]),
    meta: recordMeta,
  }),
});

/** The path: one Markdown file per step, read in `order`. A step's body can
 *  place a built-in block with an HTML comment on its own line:
 *  <!-- ladder -->, <!-- faq -->, <!-- story -->, <!-- asks -->, <!-- present -->. */
const steps = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/steps" }),
  schema: z.object({
    order: z.number().int(),
    title: z.string().max(30),
    summary: z.string().max(200),
    readTime: z.number().int().min(1).max(10),
    /** page: Markdown body. story / practice: the built-in tool. */
    kind: z.enum(["page", "story", "practice"]).default("page"),
    placeholder,
  }),
});

/** Practice situations — the Practice step now, the prospect game later. */
const scenarios = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/scenarios" }),
  schema: z.object({
    id: z.string(),
    audience: z.enum(["participant", "mentor", "problem-owner", "workshop"]),
    mode: z.enum(["conversation", "room"]),
    setup: z.string(),
    goodResponse: z.string(),
    why: z.string(),
    tags: z.array(z.string()).default([]),
    /** In the first round (the Practice step). Optional; additive. */
    core: z.boolean().default(false),
    placeholder,
  }),
});

/** Questions you'll get — shown on The Labs step. */
const faq = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/faq" }),
  schema: z.object({
    order: z.number().int(),
    question: z.string(),
    answer: z.string(),
    placeholder,
  }),
});

export const collections = { pages, roles, labs, events, cycles, steps, scenarios, faq };
