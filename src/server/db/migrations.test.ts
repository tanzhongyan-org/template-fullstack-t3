import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../../..");

const runCheck = (extraArgs: string[] = []) =>
  spawnSync(process.execPath, ["scripts/check-migrations.mjs", ...extraArgs], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
  });

describe("migration drift gate", () => {
  it("passes when drizzle/ matches src/server/db/schema.ts", () => {
    const result = runCheck();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("matches src/server/db/schema.ts");
  }, 30_000);

  it("fails when a column is added without generating a migration", () => {
    const tempDir = mkdtempSync(join(root, ".drizzle-check-"));
    try {
      const tempSchema = join(tempDir, "schema.ts");
      const baseSchema = readFileSync(join(root, "src/server/db/schema.ts"), "utf8");
      const modified = baseSchema.replace(
        'page: d.varchar("page", { length: 512 }).notNull(),',
        'page: d.varchar("page", { length: 512 }).notNull(),\n    notes: d.text("notes"),',
      );
      writeFileSync(tempSchema, modified);

      const result = runCheck([`--schema=./${basename(tempDir)}/schema.ts`]);
      expect(result.status).not.toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 30_000);

  it("fails without a TTY when a column is renamed without a migration", () => {
    const tempDir = mkdtempSync(join(root, ".drizzle-check-"));
    try {
      const tempSchema = join(tempDir, "schema.ts");
      const baseSchema = readFileSync(join(root, "src/server/db/schema.ts"), "utf8");
      const modified = baseSchema.replace(
        'body: d.text("body").notNull(),',
        'content: d.text("content").notNull(),',
      );
      writeFileSync(tempSchema, modified);

      const result = runCheck([`--schema=./${basename(tempDir)}/schema.ts`]);
      expect(result.status).not.toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 30_000);
});
