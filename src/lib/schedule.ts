/* The next upcoming session, read from data/schedule.json. Resolved in the
   browser at view time (the site is static), so a deploy never goes stale:
   once a session's start passes, the next one takes over automatically. */
import schedule from "../../data/schedule.json";

export type Session = {
  date: string; // YYYY-MM-DD, local to the venue
  time: string; // HH:MM, local to the venue
  tz: string;
  type: string;
  title: string;
  location: string;
  expect: string;
};

export const sessions: Session[] = (schedule.sessions as Session[])
  .slice()
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

/** Start instant of a session, honoring its IANA zone. */
export function startsAt(s: Session): Date {
  // Treat the wall time as UTC, then shift by the zone's offset at that time.
  const wall = new Date(`${s.date}T${s.time}:00Z`);
  const zoned = new Date(wall.toLocaleString("en-US", { timeZone: s.tz }));
  const utc = new Date(wall.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(wall.getTime() + (utc.getTime() - zoned.getTime()));
}

export function nextSession(now = new Date()): Session | null {
  return sessions.find((s) => startsAt(s).getTime() > now.getTime()) ?? null;
}

export function formatSession(s: Session, locale = "en-US"): { day: string; time: string; short: string } {
  const at = startsAt(s);
  const day = at.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", timeZone: s.tz });
  const time = at.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", timeZone: s.tz });
  const short = at.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric", timeZone: s.tz });
  return { day, time, short };
}
