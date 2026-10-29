import { index, pgTable, unique } from "drizzle-orm/pg-core";

const ownedTable = <TName extends string>(name: TName) =>
  pgTable(
    name,
    (d) => ({
      id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
      ownerId: d.varchar("owner_id", { length: 256 }).notNull(),
      title: d.varchar("title", { length: 200 }).notNull(),
      body: d.text("body").notNull(),
      createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: d.timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    }),
    (t) => [index(`${name}_owner_idx`).on(t.ownerId)],
  );

export const notes = ownedTable("notes");

/** Template example slice for `make new-feature`. Derived features add their own tables. */
export const examples = ownedTable("examples");

/** Received webhooks, keyed by provider event id so replays have no second effect. */
export const webhookEvents = pgTable(
  "webhook_events",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    provider: d.varchar("provider", { length: 64 }).notNull(),
    eventId: d.varchar("event_id", { length: 256 }).notNull(),
    type: d.varchar("type", { length: 256 }).notNull(),
    payload: d.jsonb("payload").notNull(),
    status: d.varchar("status", { length: 32 }).notNull().default("received"),
    createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [unique("webhook_events_provider_event_uniq").on(t.provider, t.eventId)],
);

/** One row per paid call (AI, SMS, email): the cost ledger. Money is integer minor units. */
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

/** Monthly spend cap per provider; the budget cron emails the owner at 80% and 100%. */
export const budget = pgTable("budget", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  provider: d.varchar("provider", { length: 128 }).notNull().unique(),
  monthlyLimitMinor: d.integer("monthly_limit_minor").notNull(),
  currency: d.varchar("currency", { length: 3 }).notNull().default("USD"),
  /** YYYY-MM the alert flags below belong to; a new month resets them. */
  period: d.varchar("period", { length: 7 }).notNull(),
  alert80Sent: d.boolean("alert_80_sent").notNull().default(false),
  alert100Sent: d.boolean("alert_100_sent").notNull().default(false),
}));

/** User feedback and NPS answers; the digest summarizes them for the owner. */
export const feedback = pgTable(
  "feedback",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    ownerId: d.varchar("owner_id", { length: 256 }).notNull(),
    kind: d.varchar("kind", { length: 32 }).notNull(),
    score: d.integer("score"),
    body: d.text("body").notNull(),
    page: d.varchar("page", { length: 512 }).notNull(),
    createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [index("feedback_owner_idx").on(t.ownerId)],
);

/** Landing-page waitlist: one row per email. */
export const waitlist = pgTable("waitlist", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  email: d.varchar("email", { length: 320 }).notNull().unique(),
  createdAt: d.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}));
