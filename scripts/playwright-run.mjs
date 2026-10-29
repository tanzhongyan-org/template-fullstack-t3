#!/usr/bin/env node
// Run a Playwright spec file, installing Chromium first when it is missing.
// Usage: node scripts/playwright-run.mjs smoke|crawl|a11y

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { runBin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");
const target = process.argv[2];
if (!["smoke", "crawl", "a11y"].includes(target)) {
  console.error("Usage: node scripts/playwright-run.mjs smoke|crawl|a11y");
  process.exit(2);
}

const require = createRequire(join(root, "package.json"));
const { chromium } = require("@playwright/test");
try {
  readFileSync(chromium.executablePath());
} catch {
  console.log("playwright: installing chromium (one-time)");
  const withDeps = process.platform === "linux" ? ["--with-deps"] : [];
  runBin("playwright", ["install", ...withDeps, "chromium"]);
}

runBin("playwright", ["test", `e2e/${target}.spec.ts`]);
