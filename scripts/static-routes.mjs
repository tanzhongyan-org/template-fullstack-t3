#!/usr/bin/env node
// Static-route check: every public route must prerender. Reads the build's
// prerender manifest, so run make build first (make static-routes does).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const manifestFile = join(root, ".next", "prerender-manifest.json");
if (!existsSync(manifestFile)) {
  console.error("static-routes: .next/prerender-manifest.json is missing; run make build first.");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const routes = manifest.routes ?? {};

// Public marketing routes from src/app/sitemap.ts; app routes stay dynamic.
const expected = ["/", "/privacy", "/terms", "/refund"];
const failures = expected.filter((path) => !(path in routes));
if (failures.length > 0) {
  console.error(`static-routes: not prerendered: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`static-routes: ${expected.join(", ")} all prerender`);
