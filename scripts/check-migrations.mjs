#!/usr/bin/env node
// Migration drift gate: verifies snapshot integrity and fails when
// src/server/db/schema.ts has unmigrated changes missing from drizzle/.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");
const drizzleDir = join(root, "drizzle");
const schemaPath = "./src/server/db/schema.ts";

const sqlFiles = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

execFileSync(bin("drizzle-kit"), ["check", "--dialect", "postgresql", "--out", "drizzle"], {
  cwd: root,
  stdio: "inherit",
});

const before = new Set(sqlFiles(drizzleDir));
const tempDir = mkdtempSync(join(tmpdir(), "drizzle-check-"));
try {
  cpSync(drizzleDir, tempDir, { recursive: true });
  execFileSync(
    bin("drizzle-kit"),
    ["generate", "--dialect", "postgresql", "--schema", schemaPath, "--out", tempDir],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    },
  );

  const added = sqlFiles(tempDir).filter((file) => !before.has(file));
  if (added.length > 0) {
    console.error(
      "db-check: src/server/db/schema.ts has unmigrated changes; run make db-generate.",
    );
    for (const file of added) {
      console.error(`--- pending ${file} ---`);
      console.error(readFileSync(join(tempDir, file), "utf8").trim());
    }
    process.exit(1);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log("db-check: drizzle/ matches src/server/db/schema.ts");
