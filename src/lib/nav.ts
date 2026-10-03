/* The global navigation's words and links (content/site/nav.json). An href
   that starts with "/" is a page here (through u(), so it works at any base
   path); anything else names a link into the live site in home.json. */
import { u } from "./url";
import nav from "../../content/site/nav.json";
import home from "../../content/site/home.json";

export type NavLink = { label: string; href: string };
export type FooterColumn = { title: string; roles?: boolean; links: NavLink[] };

const live = home.links as Record<string, string>;

/** Resolve a nav.json href: a site path through u(), or a key into the live site's links. */
export function navHref(href: string): string {
  if (href.startsWith("/")) return u(href);
  if (/^https?:/.test(href)) return href;
  const hit = live[href];
  if (!hit) throw new Error(`content/site/nav.json: "${href}" is neither a path nor a link in home.json`);
  return hit;
}

export const NAV = nav;
export const LIVE = live;

/** The start page for the account (/join/), carrying the path the person came from (?path=, proposed for OLOS). */
export const joinHref = (path?: string) => u("/join/") + (path ? `?path=${encodeURIComponent(path)}` : "");
