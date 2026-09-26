/* The path: five steps, one page each, in order. */
import { getCollection, type CollectionEntry } from "astro:content";
import { u } from "./url";

export type Step = { id: string; title: string; href: string; readTime: number };

export const stepHref = (id: string) => u(`/${id}/`);

/** The guide's Home. "/" is the public program page. */
export const guideHome = u("/guide/");

export async function steps(): Promise<CollectionEntry<"steps">[]> {
  return (await getCollection("steps")).sort((a, b) => a.data.order - b.data.order);
}

/** Plain data for the client (Home's list, each step's "next"). */
export async function path(): Promise<Step[]> {
  return (await steps()).map((s) => ({ id: s.id, title: s.data.title, href: stepHref(s.id), readTime: s.data.readTime }));
}
