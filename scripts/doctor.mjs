#!/usr/bin/env node
// Local environment health check: runtime versions, .env, Postgres TCP reachability,
// Drizzle migration drift, and pending template markers.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
let fatal = false;

const ok = (msg) => console.log(`[OK] ${msg}`);
const warn = (msg) => console.log(`[WARN] ${msg}`);
const fail = (msg) => {
  console.error(`[FAIL] ${msg}`);
  fatal = true;
};

// 1. Node.js >= 26.0.0
const [major = 0] = process.versions.node.split(".").map(Number);
if (major >= 26) {
  ok(`Node.js v${process.versions.node}`);
} else {
  fail(`Node.js v${process.versions.node} is below >= 26.0.0`);
}

// 2. Bun
const bunCheck = spawnSync("bun", ["--version"], { encoding: "utf8", timeout: 5000 });
if (bunCheck.status === 0) {
  ok(`Bun v${bunCheck.stdout.trim()}`);
} else {
  fail("Bun is not on PATH (install from https://bun.sh)");
}

// 3. node_modules
if (existsSync(join(root, "node_modules"))) {
  ok("Dependencies installed (node_modules present)");
} else {
  fail("node_modules missing; run make setup");
}

// 4. .env and DATABASE_URL
const readDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = join(root, ".env");
  if (!existsSync(envFile)) return null;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match?.[1]) return match[1];
  }
  return null;
};

if (existsSync(join(root, ".env"))) {
  ok(".env file present");
} else {
  warn(".env file missing (copy .env.example or run bun run dev:setup)");
}

// 5. Postgres TCP check
const dbUrl = readDatabaseUrl();
if (!dbUrl) {
  warn("DATABASE_URL not set; skipping PostgreSQL reachability check");
} else {
  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname || "localhost";
    const port = Number(parsed.port || 5432);
    const reachable = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(2000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (reachable) {
      ok(`PostgreSQL reachable at ${host}:${port}`);
    } else {
      warn(`PostgreSQL not reachable at ${host}:${port} (start with docker compose up -d --wait)`);
    }
  } catch {
    warn("DATABASE_URL could not be parsed as a URL");
  }
}

// 6. Drizzle migration drift
if (existsSync(join(root, "node_modules"))) {
  const drift = spawnSync("node", ["scripts/check-migrations.mjs"], {
    cwd: root,
    encoding: "utf8",
    timeout: 20_000,
  });
  if (drift.status === 0) {
    ok("Drizzle migrations match src/server/db/schema.ts");
  } else {
    fail("Migration drift detected; run make db-generate");
  }
}

// 7. Pending template markers
try {
  const todos = execFileSync(
    "git",
    ["grep", "-c", "TEMPLATE-TODO(", "--", ".", ":(exclude)Makefile", ":(exclude).ast-grep"],
    { cwd: root, encoding: "utf8" },
  );
  const brands = execFileSync(
    "git",
    ["grep", "-c", "TEMPLATE-BRAND(", "--", ".", ":(exclude)Makefile", ":(exclude).ast-grep"],
    { cwd: root, encoding: "utf8" },
  );
  const sum = (text) =>
    text
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .reduce((acc, line) => acc + Number(line.split(":").pop() || 0), 0);
  console.log(
    `[INFO] Pending template markers: ${sum(todos)} TEMPLATE-TODO, ${sum(brands)} TEMPLATE-BRAND`,
  );
} catch {
  console.log(
    "[INFO] Pending template markers: check with make template-debt and make brand-check",
  );
}

if (fatal) process.exit(1);
