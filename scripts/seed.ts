/**
 * Seed the database with deterministic demo data: a fixed PRNG seed, two
 * tenants, and rows for every empty state. Local development only.
 *
 * Usage: bun scripts/seed.ts
 */

import { db } from "../src/server/db";
import { budget, examples, feedback, notes, usageEvent, waitlist } from "../src/server/db/schema";
import { assertLocalDev } from "../src/shared/config/dev-guard";

assertLocalDev();

/** Mulberry32 with a fixed seed: the same rows on every run. */
const random = (() => {
  let state = 0x51e9;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();

const pick = <T>(items: T[]): T => {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("pick from an empty list");
  return item;
};

const tenants = ["acme-alice", "globex-bob"];
const noteTitles = ["Launch checklist", "Meeting notes", "Ideas", "Reading list"];

for (const ownerId of tenants) {
  for (const title of noteTitles.slice(0, 2)) {
    await db
      .insert(notes)
      .values({ ownerId, title: `${title} (${ownerId})`, body: "Seeded demo content." });
  }
  await db.insert(examples).values({
    ownerId,
    title: pick(noteTitles),
    body: "Seeded example slice row.",
  });
  await db.insert(feedback).values({
    ownerId,
    kind: pick(["idea", "praise", "bug"]),
    score: 8,
    body: "Seeded feedback from the demo tenant.",
    page: "/examples",
  });
}

await db.insert(waitlist).values({ email: "seeded@example.com" }).onConflictDoNothing();

const period = new Date().toISOString().slice(0, 7);
for (const provider of ["openai", "resend"]) {
  await db
    .insert(budget)
    .values({ provider, monthlyLimitMinor: 5_000, currency: "USD", period })
    .onConflictDoNothing();
  await db.insert(usageEvent).values({
    feature: "seed",
    provider,
    units: 10,
    costMinor: 120,
    currency: "USD",
  });
}

console.log(`seed: 2 tenants, sample notes, examples, feedback, waitlist, budgets (${period})`);
process.exit(0);
