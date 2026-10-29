#!/usr/bin/env node
// Lighthouse on the landing and main screen. Uses Playwright's Chromium so no
// system Chrome is needed. Writes preview-checks/lighthouse.json.
// Usage: PREVIEW_URL=https://... make lighthouse (defaults to localhost:3000)

import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { runBin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");
const require = createRequire(join(root, "package.json"));
const { chromium } = require("@playwright/test");
const executablePath = chromium.executablePath();
try {
  readFileSync(executablePath);
} catch {
  console.log("lighthouse: installing chromium (one-time)");
  const withDeps = process.platform === "linux" ? ["--with-deps"] : [];
  runBin("playwright", ["install", ...withDeps, "chromium"]);
}

const base = process.env.PREVIEW_URL ?? "http://localhost:3000";
const outDir = join(root, "preview-checks");
mkdirSync(outDir, { recursive: true });

const minimum = Number(process.env.LIGHTHOUSE_MIN_SCORE ?? 90);

const failures = [];
for (const path of ["/", "/privacy"]) {
  const slug = path === "/" ? "home" : path.slice(1);
  const out = join(outDir, `lighthouse-${slug}.json`);
  runBin(
    "lighthouse",
    [
      `${base}${path}`,
      `--output=json`,
      `--output-path=${out}`,
      "--only-categories=performance,accessibility",
      "--chrome-flags=--headless=new --no-sandbox",
    ],
    { env: { ...process.env, CHROME_PATH: executablePath } },
  );
  const report = JSON.parse(readFileSync(out, "utf8"));
  for (const category of ["performance", "accessibility"]) {
    const score = Math.round((report.categories[category]?.score ?? 0) * 100);
    console.log(`lighthouse: ${path} ${category} ${score} (min ${minimum})`);
    if (score < minimum) failures.push(`${path} ${category} is ${score}, want >= ${minimum}`);
  }
}
if (failures.length > 0) {
  for (const failure of failures) console.error(`lighthouse: FAIL ${failure}`);
  process.exit(1);
}
console.log("lighthouse: ok");
