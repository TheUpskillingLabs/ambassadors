/* Build-time helpers over the content collections. */
import { getCollection, type CollectionEntry } from "astro:content";

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
  return slug === "overview" ? `/playbooks/${e.data.playbook}/` : `/playbooks/${e.data.playbook}/${slug}/`;
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
  return `/${e.data.section}/${pageSlug(e.id)}/`;
}

export function sectionProgressId(e: CollectionEntry<"pages">): string {
  return `pages/${e.id}`;
}

export async function startHereIds(): Promise<string[]> {
  return (await sectionPages("start-here")).filter((e) => e.data.tracked).map(sectionProgressId);
}

export async function latestUpdate(): Promise<string> {
  const ups = await getCollection("updates");
  return ups.map((u) => u.data.date.toISOString().slice(0, 10)).sort().pop() ?? "";
}
