#!/usr/bin/env node
// Remove the starter _example feature slice, /examples route, and examples DB
// table once you have scaffolded your real domain features (note: make
// new-feature scaffolds from _example, so run this after scaffolding).
// Usage: node scripts/clean-examples.mjs [--dry-run]

import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const removePath = (rel, { recursive = false } = {}) => {
  const full = join(root, rel);
  if (dryRun) {
    try {
      statSync(full);
      console.log(`[dry-run] remove ${rel}`);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    return;
  }
  try {
    rmSync(full, { recursive });
    console.log(`removed ${rel}`);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
};

const editFile = (rel, transform) => {
  const full = join(root, rel);
  let before;
  try {
    before = readFileSync(full, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  const after = transform(before);
  if (after === before) return;
  if (dryRun) {
    console.log(`[dry-run] update ${rel}`);
  } else {
    writeFileSync(full, after);
    console.log(`updated ${rel}`);
  }
};

removePath("src/features/_example", { recursive: true });
removePath("src/app/examples", { recursive: true });

editFile("src/server/api/root.ts", (text) =>
  text
    .replace('import { exampleRouter } from "~/features/_example/server/router";\r\n', "")
    .replace('import { exampleRouter } from "~/features/_example/server/router";\n', "")
    .replace("  example: exampleRouter,\r\n", "")
    .replace("  example: exampleRouter,\n", ""),
);

editFile("src/server/db/schema.ts", (text) =>
  text.replace(
    /const ownedTable = [\s\S]*?export const examples = ownedTable\("examples"\);\r?\n\r?\n?/,
    "",
  ),
);

editFile("src/shared/config/site.ts", (text) =>
  text
    .replaceAll('      { label: "Examples", href: "/examples" },\r\n', "")
    .replaceAll('      { label: "Examples", href: "/examples" },\n', "")
    .replace(
      /primary: \[\r?\n\s+(\{ label: "Pricing", href: "\/#pricing" \}),\r?\n\s+\] satisfies NavLink\[\],/,
      "primary: [$1] satisfies NavLink[],",
    ),
);

editFile("src/app/page.tsx", (text) =>
  text
    .replace('import Link from "next/link";\r\n', "")
    .replace('import Link from "next/link";\n', "")
    .replace('import { buttonVariants } from "~/shared/components/ui/button";\r\n', "")
    .replace('import { buttonVariants } from "~/shared/components/ui/button";\n', "")
    .replace(
      /\r?\n[ \t]*<div className="flex flex-wrap justify-center gap-3">[\s\S]*?\/examples[\s\S]*?<\/div>/,
      "",
    ),
);

editFile("scripts/seed.ts", (text) =>
  text
    .replace(
      'import { examples, feedback } from "../src/server/db/schema";',
      'import { feedback } from "../src/server/db/schema";',
    )
    .replace(/const titles = \[[^\]]*\];\r?\n/, "")
    .replace(/[ \t]*for \(const title of titles\.slice\(0, 2\)\) \{[\s\S]*?\r?\n[ \t]*\}\r?\n/, "")
    .replace('page: "/examples"', 'page: "/"')
    .replace("sample examples and feedback seeded", "sample feedback seeded"),
);

editFile("e2e/smoke.spec.ts", (text) =>
  text.replace(/\r?\n\r?\ntest\("landing links to the example page"[\s\S]*?\r?\n\}\);\r?\n/, "\n"),
);

editFile("e2e/crawl.spec.ts", (text) =>
  text.replace(/\r?\n\r?\ntest\("example route is reachable"[\s\S]*?\r?\n\}\);\r?\n?/, "\n"),
);

editFile("ARCHITECTURE.md", (text) =>
  text.replace(/\| `src\/features\/_example\/`[^\r\n]*\r?\n/, ""),
);

editFile("scripts/repo-policy.json", (text) => {
  const parsed = JSON.parse(text);
  const ignore = parsed.docs?.ignorePaths ?? [];
  if (ignore.includes("src/features/_example")) return text;
  const nextList = [...ignore, "src/features/_example"]
    .map((item) => `      ${JSON.stringify(item)}`)
    .join(",\n");
  return text.replace(/"ignorePaths":\s*\[[^\]]*\]/, `"ignorePaths": [\n${nextList}\n    ]`);
});

const hasOwnedImport = () => {
  const ownedFull = join(root, "src", "server", "db", "owned.ts");
  const stack = [join(root, "src")];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "_example") stack.push(full);
        continue;
      }
      if (full === ownedFull || !/\.(ts|tsx)$/.test(entry.name)) continue;
      try {
        if (readFileSync(full, "utf8").includes("~/server/db/owned")) return true;
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
    }
  }
  return false;
};

if (!hasOwnedImport()) {
  removePath("src/server/db/owned.ts");
  editFile("ARCHITECTURE.md", (text) =>
    text.replace(/\| `src\/server\/db\/owned\.ts`[^\r\n]*\r?\n/, ""),
  );
}

console.log(
  dryRun
    ? "clean-examples: dry-run complete; re-run without --dry-run to apply."
    : "clean-examples: starter examples removed (make new-feature requires _example). Run make db-generate && make verify.",
);
