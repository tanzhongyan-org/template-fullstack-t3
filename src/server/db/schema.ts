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

/** User feedback submitted from the in-app FeedbackDialog. */
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
