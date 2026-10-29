/**
 * Event taxonomy: the only analytics events the product may send. Client code
 * calls track(), which posts to /api/analytics; the server validates against
 * these schemas and forwards to PostHog. Autocapture stays off: nothing is
 * recorded except the events below. Money, signup and AI events always run
 * server-side via trackServer() so blockers cannot drop them.
 */
import { z } from "zod";

export const analyticsEvents = z.enum([
  "signup_completed",
  "activated",
  "subscription_started",
  "subscription_cancelled",
  "ai_response",
  "ai_feedback",
  "waitlist_joined",
  "web_vital",
]);

export type AnalyticsEvent = z.infer<typeof analyticsEvents>;

const baseProperties = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const analyticsPayloadSchema = z.object({
  event: analyticsEvents,
  distinctId: z.string().min(1).max(256).optional(),
  properties: baseProperties.optional(),
});

export type AnalyticsPayload = z.infer<typeof analyticsPayloadSchema>;

export interface TrackResult {
  tracked: boolean;
}

/**
 * Client-safe: posts the event to /api/analytics, which validates and forwards
 * it. Import this from components, never the PostHog SDK.
 */
export async function track(input: AnalyticsPayload): Promise<TrackResult> {
  const parsed = analyticsPayloadSchema.safeParse(input);
  if (!parsed.success) return { tracked: false };
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  }).catch(() => null);
  return { tracked: response?.ok === true };
}
