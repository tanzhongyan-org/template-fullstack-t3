import { type AnalyticsPayload, analyticsPayloadSchema } from "@repo/shared/analytics";
import { PostHog } from "posthog-node";
import { env } from "~/shared/config/env";

let client: PostHog | null = null;

const getClient = (): PostHog | null => {
  if (!env.POSTHOG_API_KEY) return null;
  client ??= new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
  });
  return client;
};

/**
 * Server-side event capture. Money, signup and AI events must use this so ad
 * blockers cannot drop them. Without POSTHOG_API_KEY it is a no-op.
 */
export async function trackServer(input: AnalyticsPayload): Promise<{ tracked: boolean }> {
  const parsed = analyticsPayloadSchema.safeParse(input);
  if (!parsed.success) return { tracked: false };
  const posthog = getClient();
  if (!posthog) return { tracked: false };
  posthog.capture({
    distinctId: parsed.data.distinctId ?? "server",
    event: parsed.data.event,
    properties: parsed.data.properties,
  });
  await posthog.flush();
  return { tracked: true };
}
