/* Dated things, decided by the clock rather than by hand: which events are
   still to come, what state a Build Cycle is in. Used at build time (the site
   rebuilds daily: .github/workflows/deploy-pages.yml) and, where a page
   needs it, again in the browser, so nothing dated goes stale. */
import type { CollectionEntry } from "astro:content";

export type EventEntry = CollectionEntry<"events">;
export type CycleEntry = CollectionEntry<"cycles">;

/** The instant an event starts, honouring its zone. */
export function startsAt(e: { date: string; time: string; tz: string }): Date {
  const wall = new Date(`${e.date}T${e.time}:00Z`);
  const zoned = new Date(wall.toLocaleString("en-US", { timeZone: e.tz }));
  const utc = new Date(wall.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(wall.getTime() + (utc.getTime() - zoned.getTime()));
}

/** Events still to come (an event stays "coming up" until it has started), soonest first. */
export function upcoming(events: EventEntry[], now = new Date(), limit?: number): EventEntry[] {
  const list = events
    .filter((e) => e.data.meta.status === "live" && startsAt(e.data).getTime() > now.getTime())
    .sort((a, b) => startsAt(a.data).getTime() - startsAt(b.data).getTime());
  return limit ? list.slice(0, limit) : list;
}

/** A cycle's state on a given day: open (applications), underway, or done (after the Showcase). */
export function cycleState(c: CycleEntry["data"], now = new Date()): "open" | "underway" | "done" {
  const day = (d: string) => Date.parse(`${d}T23:59:59-04:00`);
  if (now.getTime() <= day(c.closes)) return "open";
  if (now.getTime() <= day(c.showcase)) return "underway";
  return "done";
}

/** The cycle to talk about: the one taking applications, else the one underway, else the latest done. */
export function currentCycle(cycles: CycleEntry[], lab?: string, now = new Date()): CycleEntry | undefined {
  const mine = cycles.filter((c) => (!lab || c.data.lab === lab) && c.data.meta.status === "live");
  const rank = { open: 0, underway: 1, done: 2 } as const;
  return mine.sort((a, b) => rank[cycleState(a.data, now)] - rank[cycleState(b.data, now)] || b.data.kickoff.localeCompare(a.data.kickoff))[0];
}

/** "Sep 29", "4 PM", in the event's own zone. */
export function formatEvent(e: { date: string; time: string; tz: string }, locale = "en-US"): { day: string; time: string } {
  const at = startsAt(e);
  return {
    day: at.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: e.tz }),
    time: at.toLocaleTimeString(locale, { hour: "numeric", minute: at.getMinutes() ? "2-digit" : undefined, timeZone: e.tz }),
  };
}
