/* Every internal URL goes through u(), so the site works at any base path:
   "/" on its own domain or Vercel, "/ambassadors" on GitHub Pages. The base
   comes from astro.config.mjs (BASE_PATH env at build time). */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function u(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path; // external or relative
  if (BASE && (path === BASE || path.startsWith(BASE + "/"))) return path; // already prefixed
  return BASE + path;
}

/* OLOS, The Labs' app (theupskillinglabs.org), is where the account lives,
   and the Ambassador role with it: the program page, applying, the guide, the
   deck and the coordinator's tools. Every link into it goes through olos(). */
export const OLOS = "https://theupskillinglabs.org";

export function olos(path: string): string {
  return OLOS + path;
}

/** The roles whose page lives in OLOS rather than on this site. */
const ROLE_PAGES: Record<string, string> = { ambassador: olos("/get-involved/ambassador") };

/** A role's page: here at /<slug>/, unless it lives in OLOS. */
export function roleHref(slug: string): string {
  return ROLE_PAGES[slug] ?? u(`/${slug}/`);
}
