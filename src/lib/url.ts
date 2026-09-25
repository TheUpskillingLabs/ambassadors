/* Every internal URL goes through u(), so the site works at any base path:
   "/" on its own domain or Vercel, "/ambassadors" on GitHub Pages. The base
   comes from astro.config.mjs (BASE_PATH env at build time). */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function u(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path; // external or relative
  if (BASE && (path === BASE || path.startsWith(BASE + "/"))) return path; // already prefixed
  return BASE + path;
}
