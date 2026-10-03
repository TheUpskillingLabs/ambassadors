// @ts-check
import process from "node:process";
import { defineConfig } from "astro/config";
import offline from "./src/integrations/offline.mjs";

// Static site, no backend. `site` feeds canonical URLs; swap it when the
// domain is chosen (open question in the spec).
// BASE_PATH / SITE_URL are set by the GitHub Pages workflow (the site is
// served under /ambassadors there); both default to a root deploy.
const BASE = process.env.BASE_PATH || "/";

export default defineConfig({
  site: process.env.SITE_URL || "https://ambassadors.theupskillinglabs.org",
  base: BASE,
  trailingSlash: "ignore",
  build: { format: "directory" },
  // /contributors/, /pin/ and /roles/ became /contributing/; old links still
  // work. (The ambassador tools' old addresses redirect through
  // src/pages/[...moved].astro, which keeps an invite link's #hash.) Astro
  // doesn't add the base to a redirect target, so it's added here.
  redirects: {
    "/contributors": `${BASE.replace(/\/+$/, "")}/contributing/`,
    "/pin": `${BASE.replace(/\/+$/, "")}/contributing/`,
    "/roles": `${BASE.replace(/\/+$/, "")}/contributing/`,
  },
  integrations: [offline()],
});
