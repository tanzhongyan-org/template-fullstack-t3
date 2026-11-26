#!/usr/bin/env node
// Remove the starter _example feature slice, /examples route, and examples DB
// table once you have scaffolded your real domain features.
// Usage: node scripts/clean-examples.mjs [--dry-run]

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const removeDir = (rel) => {
  const full = join(root, rel);
  if (!existsSync(full)) return;
  if (dryRun) {
    console.log(`[dry-run] remove ${rel}`);
  } else {
    rmSync(full, { recursive: true, force: true });
    console.log(`removed ${rel}`);
  }
};

const editFile = (rel, transform) => {
  const full = join(root, rel);
  if (!existsSync(full)) return;
  const before = readFileSync(full, "utf8");
  const after = transform(before);
  if (after === before) return;
  if (dryRun) {
    console.log(`[dry-run] update ${rel}`);
  } else {
    writeFileSync(full, after);
    console.log(`updated ${rel}`);
  }
};

removeDir("src/features/_example");
removeDir("src/app/examples");

editFile("src/server/api/root.ts", (text) =>
  text
    .replace('import { exampleRouter } from "~/features/_example/server/router";\n', "")
    .replace('import { exampleRouter } from "~/features/_example/server/router";\r\n', "")
    .replace("  example: exampleRouter,\n", "")
    .replace("  example: exampleRouter,\r\n", ""),
);

editFile("src/server/db/schema.ts", (text) =>
  text.replace(
    /const ownedTable = [\s\S]*?export const examples = ownedTable\("examples"\);\r?\n\r?\n?/,
    "",
  ),
);

editFile("src/shared/config/site.ts", (text) =>
  text
    .replace('      { label: "Examples", href: "/examples" },\n', "")
    .replace('      { label: "Examples", href: "/examples" },\r\n', ""),
);

editFile("src/app/page.tsx", (text) =>
  text
    .replace('import Link from "next/link";\n', "")
    .replace('import Link from "next/link";\r\n', "")
    .replace('import { buttonVariants } from "~/shared/components/ui/button";\n', "")
    .replace('import { buttonVariants } from "~/shared/components/ui/button";\r\n', "")
    .replace(
      /\s*<div className="flex flex-wrap justify-center gap-3">[\s\S]*?\/examples[\s\S]*?<\/div>\r?\n/,
      "\n",
    ),
);

console.log(
  dryRun
    ? "clean-examples: dry-run complete; re-run without --dry-run to apply."
    : "clean-examples: starter examples removed. Run make db-generate && make verify.",
);
