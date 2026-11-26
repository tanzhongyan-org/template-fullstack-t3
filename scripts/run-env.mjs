#!/usr/bin/env node
// Cross-platform env wrapper for package.json and Makefile targets.
// Usage: node scripts/run-env.mjs [--dotenv] [KEY=VALUE] [OPT?=FALLBACK] -- <bin> [args...]

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runBin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");

const loadDotenv = () => {
  const envFile = join(root, ".env");
  if (!existsSync(envFile)) return;
  for (const rawLine of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
if (sep === -1 || sep === argv.length - 1) {
  console.error("Usage: node scripts/run-env.mjs [--dotenv] KEY=VALUE -- <bin> [args...]");
  process.exit(2);
}

for (const pair of argv.slice(0, sep)) {
  if (pair === "--dotenv") {
    loadDotenv();
    continue;
  }
  const defaultIdx = pair.indexOf("?=");
  if (defaultIdx > 0) {
    const key = pair.slice(0, defaultIdx);
    const val = pair.slice(defaultIdx + 2);
    if (!process.env[key]) process.env[key] = val;
    continue;
  }
  const eqIdx = pair.indexOf("=");
  if (eqIdx > 0) {
    process.env[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
  } else {
    console.error(`run-env: invalid assignment '${pair}'`);
    process.exit(2);
  }
}

const [cmd, ...args] = argv.slice(sep + 1);
if (!cmd) process.exit(2);

try {
  runBin(cmd, args);
} catch (error) {
  process.exit(typeof error?.status === "number" ? error.status : 1);
}
