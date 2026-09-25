/* Build-time helpers over the content collections. */
import { getCollection, type CollectionEntry } from "astro:content";
import { u } from "./url";

export type PlaybookId = "conversation" | "room";

export function pageSlug(id: string): string {
  // "conversation/ask" -> "ask"
  return id.split("/").pop()!;
}

export async function playbookPages(pb: PlaybookId) {
  const all = await getCollection("playbooks", (e) => e.data.playbook === pb);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export function playbookHref(e: CollectionEntry<"playbooks">): string {
  const slug = pageSlug(e.id);
  return u(slug === "overview" ? `/playbooks/${e.data.playbook}/` : `/playbooks/${e.data.playbook}/${slug}/`);
}

/** Progress id for a page — stable, used as the localStorage key. */
export function playbookProgressId(e: CollectionEntry<"playbooks">): string {
  return `playbooks/${e.id}`;
}

export async function sectionPages(section: CollectionEntry<"pages">["data"]["section"]) {
  const all = await getCollection("pages", (e) => e.data.section === section);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export function sectionHref(e: CollectionEntry<"pages">): string {
  return u(`/${e.data.section}/${pageSlug(e.id)}/`);
}

export function sectionProgressId(e: CollectionEntry<"pages">): string {
  return `pages/${e.id}`;
}

export async function startHereIds(): Promise<string[]> {
  return (await sectionPages("start-here")).filter((e) => e.data.tracked).map(sectionProgressId);
}

export async function latestUpdate(): Promise<string> {
  const ups = await getCollection("updates");
  return ups.map((e) => e.data.date.toISOString().slice(0, 10)).sort().pop() ?? "";
}

export type PathStep = { id: string; title: string; href: string; readTime: number; section: string };
export type PathGroup = { id: string; title: string; blurb: string; href: string; steps: PathStep[]; kind: "pages" | "story" };

/** The readiness path, in the order a new ambassador should take it. Home
 *  uses it for "Continue where you left off" and the readiness checklist. */
export async function readinessPath(): Promise<PathGroup[]> {
  const sections = (await import("../../content/site/sections.json")).default;
  const page = (s: "start-here" | "know-the-labs") => sectionPages(s).then((ps) => ps.filter((p) => p.data.tracked).map((p) => ({
    id: sectionProgressId(p), title: p.data.navLabel ?? p.data.title, href: sectionHref(p), readTime: p.data.readTime, section: s,
  })));
  const book = (pb: PlaybookId) => playbookPages(pb).then((ps) => ps.map((p) => ({
    id: playbookProgressId(p), title: p.data.navLabel ?? p.data.title, href: playbookHref(p), readTime: p.data.readTime, section: pb,
  })));
  const byId = Object.fromEntries(sections.sections.map((s) => [s.id, s]));
  const items = sections.playbooks.items;
  return [
    { id: "start-here", title: byId["start-here"].title, blurb: byId["start-here"].blurb, href: u(byId["start-here"].href), steps: await page("start-here"), kind: "pages" },
    { id: "know-the-labs", title: byId["know-the-labs"].title, blurb: byId["know-the-labs"].blurb, href: u(byId["know-the-labs"].href), steps: await page("know-the-labs"), kind: "pages" },
    { id: "conversation", title: items.conversation.title, blurb: items.conversation.blurb, href: u("/playbooks/conversation/"), steps: await book("conversation"), kind: "pages" },
    { id: "your-story", title: byId["your-story"].title, blurb: byId["your-story"].blurb, href: u(byId["your-story"].href), steps: [], kind: "story" },
    { id: "room", title: items.room.title, blurb: items.room.blurb, href: u("/playbooks/room/"), steps: await book("room"), kind: "pages" },
  ];
}
