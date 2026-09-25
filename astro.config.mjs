// @ts-check
import { defineConfig } from "astro/config";
import offline from "./src/integrations/offline.mjs";

// Static site, no backend. `site` feeds canonical URLs; swap it when the
// domain is chosen (open question in the spec).
export default defineConfig({
  site: "https://ambassadors.theupskillinglabs.org",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [offline()],
});
