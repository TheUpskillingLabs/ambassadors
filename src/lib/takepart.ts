/* Helpers for the take-part pages (workshops, events, Build Cycles, Labs). */
import type { CollectionEntry } from "astro:content";
import labsCopy from "../../content/site/labs.json";

/** "{n} waiting" → "3 waiting". */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

export type LabEntry = CollectionEntry<"labs">;

/** A Lab's stage, in words (content/site/labs.json). */
export const stageWord = (stage: LabEntry["data"]["stage"]) => (labsCopy.stages as Record<string, string>)[stage];

/** What a Lab's list shows under its name: the library, or the names gathering (a count only once there are a few; before that, that the list has started, or that it hasn't). */
export function labLine(l: LabEntry): string {
  const d = l.data;
  if (d.stage === "active" || d.stage === "chartered") return [d.library, d.members ? fill(labsCopy.lab.members, { n: d.members }) : ""].filter(Boolean).join(" · ");
  const n = d.waiting ?? 0;
  return n >= labsCopy.list.threshold ? fill(labsCopy.list.waiting, { n }) : n > 0 ? labsCopy.list.started : labsCopy.list.first;
}

/** Running Labs first, then the rest by how far along they are, then by name. */
const ORDER = ["chartered", "active", "first-cycle", "first-workshops", "forming", "list"];
export const byStage = (a: LabEntry, b: LabEntry) => ORDER.indexOf(a.data.stage) - ORDER.indexOf(b.data.stage) || a.data.city.localeCompare(b.data.city);

/** A long date: "October 13, 2026". */
export const longDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
