# Mobile Uniwind Tokens & Notes CRUD Recipes

The template ships only web CSS variables from `packages/shared/tokens.ts` and keeps `src/features/_example/` as the sole sample CRUD slice. Restore Uniwind tokens or a multi-field `notes` slice on demand.

## 1. Sharing Brand Tokens with Expo / Uniwind

If you add a React Native / Expo client importing shared colors via Uniwind, extend `scripts/generate-tokens.ts` to write a second CSS target alongside `src/styles/generated/tokens.css`:

```ts
// Inside scripts/generate-tokens.ts
const uniwindFile = join(outDir, "tokens.uniwind.css");

function uniwindCss(): string {
  const light = names.map((n) => `  --color-${n}: ${tokens[n].light};`).join("\n");
  const dark = names.map((n) => `  --color-${n}: ${tokens[n].dark};`).join("\n");
  return `${header}@theme {\n${light}\n}\n\n@variant dark {\n${dark}\n}\n`;
}
```

Then run `make tokens` and verify contrast with `make contrast`.

## 2. Scaffolding a Notes or Domain CRUD Slice

Rather than shipping duplicate starter CRUD tables, scaffold domain slices on demand from `src/features/_example/`:

```bash
make new-feature name=notes
```

Update the copied schema, router procedures (filtering every query/mutation by `ctx.ownerId`), and components for your domain, add the `notes` table to `src/server/db/schema.ts`, and run `make db-generate && make verify`.
