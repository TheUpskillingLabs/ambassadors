// @ts-check
import process from "node:process";
import { defineConfig } from "astro/config";
import offline from "./src/integrations/offline.mjs";

// Static site, no backend. `site` feeds canonical URLs; swap it when the
// domain is chosen (open question in the spec).
// BASE_PATH / SITE_URL are set by the GitHub Pages workflow (the site is
// served under /ambassadors there); both default to a root deploy.
export default defineConfig({
  site: process.env.SITE_URL || "https://ambassadors.theupskillinglabs.org",
  base: process.env.BASE_PATH || "/",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [offline()],
});
