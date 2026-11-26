/**
 * Event taxonomy: the only analytics events the product may send. Client code
 * calls track(), which posts client-safe events to /api/analytics; the server
 * validates, derives distinctId server-side, rate-limits, and forwards to PostHog.
 * Money, signup, payment, and AI events belong to serverAnalyticsEvents and
 * must run server-side via trackServer() so browsers cannot forge or drop them.
 */
import { z } from "zod";

/** Events a browser client is permitted to emit via /api/analytics. */
export const clientAnalyticsEvents = z.enum([
  "activated",
  "feature_used",
  "feedback_submitted",
  "cta_clicked",
]);

/** Server-only events (auth, payments, AI) rejected at the public client endpoint. */
export const serverAnalyticsEvents = z.enum([
  "signup_completed",
  "subscription_started",
  "subscription_cancelled",
  "payment_refunded",
  "payment_disputed",
  "ai_response",
  "ai_feedback",
]);

/** Full product event taxonomy across client and server. */
export const analyticsEvents = z.enum([
  ...clientAnalyticsEvents.options,
  ...serverAnalyticsEvents.options,
]);

export type ClientAnalyticsEvent = z.infer<typeof clientAnalyticsEvents>;
export type ServerAnalyticsEvent = z.infer<typeof serverAnalyticsEvents>;
export type AnalyticsEvent = z.infer<typeof analyticsEvents>;

const baseProperties = z
  .record(z.string().max(64), z.union([z.string().max(500), z.number(), z.boolean()]))
  .refine((obj) => Object.keys(obj).length <= 20, "Too many properties");

export const clientAnalyticsPayloadSchema = z.object({
  event: clientAnalyticsEvents,
  properties: baseProperties.optional(),
});

export const analyticsPayloadSchema = z.object({
  event: analyticsEvents,
  distinctId: z.string().min(1).max(256).optional(),
  properties: baseProperties.optional(),
});

export type ClientAnalyticsPayload = z.infer<typeof clientAnalyticsPayloadSchema>;
export type AnalyticsPayload = z.infer<typeof analyticsPayloadSchema>;

export interface TrackResult {
  tracked: boolean;
}

/**
 * Client-safe: posts a client-allowed event to /api/analytics, which derives
 * identity server-side and forwards via trackServer().
 */
export async function track(input: ClientAnalyticsPayload): Promise<TrackResult> {
  const parsed = clientAnalyticsPayloadSchema.safeParse(input);
  if (!parsed.success) return { tracked: false };
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  }).catch(() => null);
  return { tracked: response?.ok === true };
}
