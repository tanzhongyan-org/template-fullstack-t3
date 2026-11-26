# AI Cost Ledger & Scheduled Cron Alerts

When your product calls paid AI/SMS APIs, add an integer minor-unit ledger and scheduled budget alerts using the built-in `cronAuthorized` helper in `src/server/cron.ts`.

## 1. Add Drizzle Tables

Add `usageEvent` and `budget` to `src/server/db/schema.ts`, then run `make db-generate`:

```ts
import { index, pgTable } from "drizzle-orm/pg-core";

export const usageEvent = pgTable(
  "usage_event",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    feature: d.varchar("feature", { length: 128 }).notNull(),
    provider: d.varchar("provider", { length: 128 }).notNull(),
    units: d.integer("units").notNull(),
    costMinor: d.integer("cost_minor").notNull(),
    currency: d.varchar("currency", { length: 3 }).notNull().default("USD"),
    createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [index("usage_event_provider_created_idx").on(t.provider, t.createdAt)],
);

export const budget = pgTable("budget", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  provider: d.varchar("provider", { length: 128 }).notNull().unique(),
  monthlyLimitMinor: d.integer("monthly_limit_minor").notNull(),
  currency: d.varchar("currency", { length: 3 }).notNull().default("USD"),
  period: d.varchar("period", { length: 7 }).notNull(),
  alert80Sent: d.boolean("alert_80_sent").notNull().default(false),
  alert100Sent: d.boolean("alert_100_sent").notNull().default(false),
}));
```

## 2. Guard Scheduled Cron Endpoints

Every cron endpoint checks `cronAuthorized(request)` from `src/server/cron.ts` (which uses constant-time `timingSafeEqual` comparison against `CRON_SECRET`):

```ts
import { cronAuthorized, unauthorized } from "~/server/cron";
import { sendEmail } from "~/server/email";
import { site } from "~/shared/config/site";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return unauthorized();

  // Compute monthly spend from usageEvent and compare against budget rows
  await sendEmail({
    to: site.ownerEmail,
    subject: "Daily budget check complete",
    html: "<p>All providers within threshold.</p>",
  });
  return Response.json({ ok: true });
}
```

## 3. Schedule in `vercel.json`

Add your route schedule under `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["sin1"],
  "crons": [{ "path": "/api/cron/budget-check", "schedule": "0 1 * * *" }]
}
```

Set `CRON_SECRET` in Vercel environment variables (`openssl rand -hex 32`) so Vercel's cron runner authenticates automatically.
