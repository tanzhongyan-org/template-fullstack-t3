#!/usr/bin/env node
// Security target: vulnerability audit, pin hygiene, and the new-dependency
// age check (a dependency added by a pull request must exist on the registry
// and be at least 14 days old). Secret history scanning runs in CI.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const failures = [];

const run = (command, args) => {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
};

// 1. Vulnerability audit.
console.log("security: running bun audit");
try {
  execSync("bun audit --audit-level=high", { cwd: root, stdio: "inherit" });
} catch {
  failures.push("bun audit found high or critical advisories");
}

// 2. No floating versions in manifests.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
  for (const [name, range] of Object.entries(pkg[section] ?? {})) {
    if (range === "latest" || range === "*") failures.push(`${name} floats on ${range}`);
  }
}

// 3. New-dependency age check against the merge base.
const base = run("git", ["merge-base", "origin/main", "HEAD"])?.trim();
if (!base) {
  console.log("security: no origin/main merge base; skipping the age check");
} else {
  let oldPkg = {};
  try {
    oldPkg = JSON.parse(
      execFileSync("git", ["show", `${base}:package.json`], { cwd: root, encoding: "utf8" }),
    );
  } catch {
    oldPkg = {};
  }
  const oldNames = new Set(
    Object.keys({
      ...oldPkg.dependencies,
      ...oldPkg.devDependencies,
      ...oldPkg.optionalDependencies,
    }),
  );
  const added = Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.optionalDependencies,
  }).filter(([name]) => !oldNames.has(name));

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  for (const [name, range] of added) {
    const version = String(range)
      .replace(/^[\^~>=<=\s]+/, "")
      .split(" ")[0];
    let published;
    try {
      const response = await fetch(`https://registry.npmjs.org/${name}`);
      if (!response.ok) {
        failures.push(`${name}@${version} does not exist on the registry`);
        continue;
      }
      published = new Date((await response.json()).time?.[version]).getTime();
    } catch {
      console.log(`security: registry unreachable; skipping the age check for ${name}`);
      continue;
    }
    if (Number.isNaN(published)) {
      failures.push(`${name}@${version} has no publish date`);
    } else if (Date.now() - published < FOURTEEN_DAYS_MS) {
      failures.push(`${name}@${version} is under 14 days old`);
    } else {
      console.log(`security: ${name}@${version} age ok`);
    }
  }
  if (added.length === 0) console.log("security: no new dependencies vs origin/main");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`security: FAIL ${failure}`);
  process.exit(1);
}
console.log("security: ok");
