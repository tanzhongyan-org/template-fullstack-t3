#!/usr/bin/env node
// Scaffold a gate-clean feature slice from src/features/_example.
// Usage: make new-feature name=widget
//
// Copies the slice, renames identifiers (camelCase for TS/tRPC identifiers,
// kebab-case for paths/files), registers the router in src/server/api/root.ts,
// and scaffolds src/app/<name>/ pages so every gate passes without further edits.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { runBin } from "./bin.mjs";

const root = join(import.meta.dirname, "..");
const arg = process.argv.find((a) => a.startsWith("--name="));
const name = arg?.slice("--name=".length) ?? "";

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error("Usage: make new-feature name=<kebab-case-name>");
  process.exit(1);
}
if (name === "_example" || name === "example") {
  console.error("Pick a name other than the template slice itself.");
  process.exit(1);
}

const pascal = name
  .split("-")
  .map((part) => (part[0]?.toUpperCase() ?? "") + part.slice(1))
  .join("");
const camel = (pascal[0]?.toLowerCase() ?? "") + pascal.slice(1);

const target = join(root, "src", "features", name);
if (existsSync(target)) {
  console.error(`src/features/${name} already exists.`);
  process.exit(1);
}

cpSync(join(root, "src", "features", "_example"), target, { recursive: true });

const renameFile = (from, to) => {
  const a = join(target, from);
  const b = join(target, to);
  if (existsSync(a)) renameSync(a, b);
};
renameFile("schemas/example.ts", `schemas/${name}.ts`);
renameFile("components/example-list.tsx", `components/${name}-list.tsx`);
renameFile("components/example-list.stories.tsx", `components/${name}-list.stories.tsx`);
renameFile("components/example-form.tsx", `components/${name}-form.tsx`);
renameFile("components/example-form.stories.tsx", `components/${name}-form.stories.tsx`);
renameFile("components/example-manager.tsx", `components/${name}-manager.tsx`);

const rewrite = (file, replacements) => {
  let text = readFileSync(file, "utf8");
  for (const [from, to] of replacements) text = text.split(from).join(to);
  writeFileSync(file, text);
};

const collect = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collect(full));
    else out.push(full);
  }
  return out;
};

const replacements = [
  ["ExampleManager", `${pascal}Manager`],
  ["ExampleList", `${pascal}List`],
  ["ExampleForm", `${pascal}Form`],
  ["ExampleItem", `${pascal}Item`],
  ["exampleRouter", `${camel}Router`],
  ["exampleCreatedEmail", `${camel}CreatedEmail`],
  ["createExampleSchema", `create${pascal}Schema`],
  ["updateExampleSchema", `update${pascal}Schema`],
  ["exampleIdSchema", `${camel}IdSchema`],
  ["exampleNotFound", `${camel}NotFound`],
  [".example.", `.${camel}.`],
  ["Example/Form", `${pascal}/Form`],
  ["Example/List", `${pascal}/List`],
  ["example-", `${name}-`],
  ["example_", `${name}_`],
  ["./example-form", `./${name}-form`],
  ["./example-list", `./${name}-list`],
  ["./example-manager", `./${name}-manager`],
  ["../schemas/example", `../schemas/${name}`],
  ['"example"', `"${name}"`],
  ["'example'", `'${name}'`],
  ["the example", `the ${name}`],
  ["New example", `New ${name}`],
  ["Create example", `Create ${name}`],
  ["No examples yet", `No ${name}s yet`],
  ["Example not found", `${pascal} not found`],
  ["Failed to create example", `Failed to create ${name}`],
];
for (const file of collect(target)) rewrite(file, replacements);

// The slice reads the shared examples table; derived features rename it and
// generate a migration when the shape diverges.
console.log(
  `new-feature: ${name} shares the examples table; rename it and run make db-generate when the shape diverges.`,
);

// Register the router in root.ts after the example entry.
const rootFile = join(root, "src", "server", "api", "root.ts");
let rootText = readFileSync(rootFile, "utf8");
const importAnchor = 'import { exampleRouter } from "~/features/_example/server/router";';
if (!rootText.includes(importAnchor)) {
  console.error("new-feature: root.ts anchor import is missing; register the router by hand.");
  process.exit(1);
}
rootText = rootText.replace(
  importAnchor,
  `${importAnchor}\nimport { ${camel}Router } from "~/features/${name}/server/router";`,
);
rootText = rootText.replace(
  "  example: exampleRouter,\n",
  `  example: exampleRouter,\n  ${camel}: ${camel}Router,\n`,
);
writeFileSync(rootFile, rootText);

// Scaffold the route pages from the examples route.
const appDir = join(root, "src", "app", name);
mkdirSync(appDir, { recursive: true });
const pageReplacements = [
  ...replacements,
  ["ExamplesPage", `${pascal}Page`],
  ["ExamplesLoading", `${pascal}Loading`],
  ["ExamplesError", `${pascal}Error`],
  ["~/features/_example", `~/features/${name}`],
  ["Examples failed to load", `${pascal}s failed to load`],
  ["Examples", `${pascal}s`],
  ["examples", name],
  ["/examples", `/${name}`],
];
for (const file of ["page.tsx", "loading.tsx", "error.tsx"]) {
  const source = readFileSync(join(root, "src", "app", "examples", file), "utf8");
  let text = source;
  for (const [from, to] of pageReplacements) text = text.split(from).join(to);
  writeFileSync(join(appDir, file), text);
}

runBin("biome", [
  "check",
  "--write",
  `src/features/${name}`,
  `src/app/${name}`,
  "src/server/api/root.ts",
]);

console.log(`new-feature: src/features/${name} and src/app/${name}/ are ready. Run make verify.`);
