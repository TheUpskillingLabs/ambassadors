/* Content schemas — the contract every content file is validated against at
   build time. Copy lives in /content (Markdown + JSON), never in components.

   STABILITY: the `scenarios` schema is read by the planned prospect game.
   Add optional fields only; never rename or remove one. */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Every entry can be flagged as draft copy. Rendered as a visible
 *  [PLACEHOLDER] marker until real Labs copy is dropped in. */
const placeholder = z.boolean().default(false);

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

export const collections = { steps, scenarios, faq };
