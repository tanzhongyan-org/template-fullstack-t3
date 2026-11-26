#!/usr/bin/env node
// Migration drift gate: verifies snapshot integrity and fails when
// src/server/db/schema.ts has unmigrated changes missing from drizzle/.

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { bin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");

const readArg = (prefix, fallback) => {
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const schemaPath = readArg("--schema=", "./src/server/db/schema.ts");
const drizzleDirRel = relative(
  root,
  resolve(root, readArg("--drizzle-dir=", "drizzle")),
).replaceAll("\\", "/");
const drizzleDirFull = resolve(root, drizzleDirRel);

const sqlFiles = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

const drizzleKitBin = bin("drizzle-kit");
const spawnOptions = {
  cwd: root,
  encoding: "utf8",
  timeout: 30_000,
  ...(process.platform === "win32" && /\.(cmd|bat)$/i.test(drizzleKitBin) ? { shell: true } : {}),
};

const checkResult = spawnSync(
  drizzleKitBin,
  ["check", "--dialect", "postgresql", "--out", drizzleDirRel],
  {
    ...spawnOptions,
    stdio: "inherit",
  },
);
if (checkResult.error || checkResult.status !== 0) {
  if (checkResult.error) console.error(checkResult.error.message);
  process.exit(checkResult.status ?? 1);
}

const before = new Set(sqlFiles(drizzleDirFull));
// Temp dir MUST live under `root` so `--out` is relative: drizzle-kit 0.31 reads snapshots as `./${out}`.
const tempDir = mkdtempSync(join(root, ".drizzle-check-"));
const relOut = basename(tempDir);

let exitCode = 0;

try {
  cpSync(drizzleDirFull, tempDir, { recursive: true });
  const generateResult = spawnSync(
    drizzleKitBin,
    ["generate", "--dialect", "postgresql", "--schema", schemaPath, "--out", relOut],
    {
      ...spawnOptions,
      input: "\n".repeat(20),
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  const stdout = generateResult.stdout ?? "";
  const stderr = (generateResult.stderr ?? "").trim();
  const added = sqlFiles(tempDir).filter((file) => !before.has(file));

  if (added.length > 0) {
    console.error(
      "db-check: src/server/db/schema.ts has unmigrated changes; run make db-generate.",
    );
    for (const file of added) {
      console.error(`--- pending ${file} ---`);
      console.error(readFileSync(join(tempDir, file), "utf8").trim());
    }
    exitCode = 1;
  } else if (
    generateResult.error ||
    generateResult.status !== 0 ||
    stderr.length > 0 ||
    !/no schema changes/i.test(stdout)
  ) {
    console.error("db-check: drizzle-kit generate did not confirm a clean schema.");
    if (generateResult.error) console.error(generateResult.error.message);
    if (stderr) console.error(stderr);
    if (stdout.trim()) console.error(stdout.trim());
    exitCode = 1;
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (exitCode !== 0) process.exit(exitCode);

console.log("db-check: drizzle/ matches src/server/db/schema.ts");
