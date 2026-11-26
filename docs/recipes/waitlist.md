# Pre-Launch Waitlist Recipe

If you want to capture email signups before launching your product, add a `waitlist` feature slice with optional Cloudflare Turnstile bot protection and `rateLimit` middleware.

## 1. Add the Table

Add `waitlist` to `src/server/db/schema.ts` and run `make db-generate`:

```ts
export const waitlist = pgTable("waitlist", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  email: d.varchar("email", { length: 320 }).notNull().unique(),
  createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}));
```

## 2. Scaffold & Lock Down the Router

Run `make new-feature name=waitlist` or add a router using `rateLimit` middleware for public joins and `adminProcedure` for listing signups (never expose `waitlist` emails to `protectedProcedure`):

```ts
import { count, desc } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure, rateLimit } from "~/server/api/trpc";
import { waitlist } from "~/server/db/schema";

const joinProcedure = publicProcedure.use(
  rateLimit({
    limit: 5,
    windowMs: 60_000,
    keyPrefix: "waitlist.join",
  }),
);

export const waitlistRouter = createTRPCRouter({
  join: joinProcedure
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ ctx, input }) => {
      const normalized = input.email.trim().toLowerCase();
      await ctx.db.insert(waitlist).values({ email: normalized }).onConflictDoNothing();
      const [row] = await ctx.db.select({ total: count() }).from(waitlist);
      return { position: Number(row?.total ?? 1) };
    }),

  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.waitlist.findMany({
      orderBy: [desc(waitlist.createdAt)],
      limit: 500,
    });
  }),
});
```

If enabling Cloudflare Turnstile, add `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to `src/shared/config/env.js`, `.env.example`, and `README.md`, and verify the `turnstileToken` on `https://challenges.cloudflare.com/turnstile/v0/siteverify` inside `join` before inserting.
