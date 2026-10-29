#!/usr/bin/env node
// Restore drill: prove the latest backup restores. Takes a pg_dump custom-format
// file, restores it into a scratch database on the compose Postgres service,
// counts the core tables, and drops the scratch database.
//
// Usage: BACKUP_FILE=./latest.dump make restore-drill

import { execFileSync } from "node:child_process";

const backupFile = process.env.BACKUP_FILE;
if (!backupFile) {
  console.error("restore-drill: set BACKUP_FILE to a pg_dump custom-format file.");
  process.exit(2);
}

const compose = (args, options = {}) =>
  execFileSync("docker", ["compose", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    ...options,
  });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const scratch = `restore_drill_${stamp}`;
console.log(`restore-drill: copying ${backupFile} into the postgres service`);
const container = compose(["ps", "-q", "postgres"]).trim().split("\n")[0];
if (!container) {
  console.error("restore-drill: the postgres service is not running (make dev needs it).");
  process.exit(1);
}
execFileSync("docker", ["cp", backupFile, `${container}:/tmp/drill.dump`], { stdio: "inherit" });
execFileSync(
  "docker",
  ["compose", "exec", "-T", "postgres", "createdb", "-U", "postgres", scratch],
  {
    stdio: "inherit",
  },
);
try {
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_restore",
      "-U",
      "postgres",
      "-d",
      scratch,
      "/tmp/drill.dump",
    ],
    { stdio: "inherit" },
  );
  const counts = compose([
    "exec",
    "-T",
    "postgres",
    "psql",
    "-U",
    "postgres",
    "-d",
    scratch,
    "-tAc",
    "select count(*) from notes; select count(*) from webhook_events;",
  ]);
  console.log(
    `restore-drill: restored counts (notes, webhook_events): ${counts.trim().split("\n").join(", ")}`,
  );
} finally {
  execFileSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "dropdb", "-U", "postgres", scratch],
    {
      stdio: "inherit",
    },
  );
  execFileSync("docker", ["compose", "exec", "-T", "postgres", "rm", "-f", "/tmp/drill.dump"], {
    stdio: "inherit",
  });
}
console.log("restore-drill: ok");
