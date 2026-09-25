/* Content schemas — the contract every content file is validated against at
   build time. Copy lives in /content (Markdown + JSON), never in components.

   STABILITY: the `scenarios` schema is read by the planned prospect game.
   Add optional fields only; never rename or remove one. */
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Every entry can be flagged as draft copy. Rendered as a visible
 *  [PLACEHOLDER] marker until real Labs copy is dropped in. */
const placeholder = z.boolean().default(false);

const INCLUDE = z.enum(["audiences", "glossary", "faq", "ladder", "story-examples"]);
const AUDIENCES = ["participant", "mentor", "problem-owner", "workshop"] as const;
const MODES = ["conversation", "room"] as const;

/** Playbook page template — every page in both playbooks. */
const playbooks = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/playbooks" }),
  schema: z.object({
    playbook: z.enum(MODES),
    order: z.number().int(),
    title: z.string().max(40),
    navLabel: z.string().optional(),
    readTime: z.number().int().min(1).max(10),
    summary: z.string(),
    why: z.string(),
    shape: z.array(z.string()).min(1),
    examples: z.array(z.string()).min(2).max(3),
    watchOutFor: z.array(z.string()).min(2).max(4),
    tryIt: z.string(),
    /** Renders the practice deck of scenarios for this playbook's mode. */
    practice: z.boolean().default(false),
    /** Shows the reader's saved 30-second why (Your Story). */
    showStory: z.boolean().default(false),
    /** Structured content shown on the page (e.g. audience profiles). */
    include: z.enum(["audiences"]).optional(),
    /** Shows a dated invite filled from the next session in schedule.json. */
    showInvite: z.boolean().default(false),
    placeholder,
  }),
});

/** Plain guide pages: Start Here, Know the Labs, Your Story examples,
 *  Deck customize. `include` pulls a structured collection into the page. */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/pages" }),
  schema: z.object({
    section: z.enum(["start-here", "know-the-labs", "your-story", "deck", "help"]),
    order: z.number().int(),
    title: z.string(),
    navLabel: z.string().optional(),
    readTime: z.number().int().min(1).max(10),
    summary: z.string(),
    include: z.union([INCLUDE, z.array(INCLUDE)]).optional(),
    /** Counts toward progress ("3 of 5 read"). Utility pages opt out. */
    tracked: z.boolean().default(true),
    placeholder,
  }),
});

/** Practice scenarios — Practice pages now, the prospect game later. */
const scenarios = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/scenarios" }),
  schema: z.object({
    id: z.string(),
    audience: z.enum(AUDIENCES),
    mode: z.enum(MODES),
    setup: z.string(),
    goodResponse: z.string(),
    why: z.string(),
    tags: z.array(z.string()).default([]),
    /** Pinned to the front of a first round. Optional; additive. */
    core: z.boolean().default(false),
    placeholder,
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/faq" }),
  schema: z.object({
    order: z.number().int(),
    question: z.string(),
    answer: z.string(),
    audiences: z.array(z.enum(AUDIENCES)).default([]),
    placeholder,
  }),
});

/** Who we recruit — five profiles, priority audiences first. */
const audiences = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/audiences" }),
  schema: z.object({
    order: z.number().int(),
    name: z.string(),
    priority: z.boolean().default(false),
    /** Which scenario audience this profile practices against. */
    scenarioAudience: z.enum(AUDIENCES),
    whoTheyAre: z.string(),
    whatTheyGet: z.string(),
    theAsk: z.string(),
    whereToFind: z.array(z.string()).min(3).max(5),
    commonQuestions: z.array(reference("faq")).default([]),
    placeholder,
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/glossary" }),
  schema: z.object({
    term: z.string(),
    kind: z.enum(["brand", "method"]),
    definition: z.string(),
    do: z.string(),
    dont: z.string(),
    placeholder,
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/updates" }),
  schema: z.object({
    date: z.coerce.date(),
    change: z.string(),
    link: z.string().optional(),
  }),
});

/** One cheat sheet per playbook. */
const refreshers = defineCollection({
  loader: glob({ pattern: "*.json", base: "./content/refreshers" }),
  schema: z.object({
    playbook: z.enum(MODES),
    title: z.string(),
    readTime: z.number().int(),
    shape: z.array(z.object({ step: z.string(), cue: z.string() })).min(1),
    reminders: z.array(z.string()).length(3),
    showStory: z.boolean().default(false),
    placeholder,
  }),
});

export const collections = { playbooks, pages, scenarios, faq, audiences, glossary, updates, refreshers };
