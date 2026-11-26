import { type AnalyticsPayload, analyticsPayloadSchema } from "@repo/shared/analytics";
import { PostHog } from "posthog-node";
import { logError } from "~/server/log";
import { env } from "~/shared/config/env";

export interface AnalyticsAdapter {
  capture: (
    payload: Required<Pick<AnalyticsPayload, "event" | "distinctId">> & {
      properties?: AnalyticsPayload["properties"];
    },
  ) => Promise<void>;
  getFeatureFlag: (flag: string, distinctId: string) => Promise<boolean | string | undefined>;
}

let posthogClient: PostHog | null = null;
let testAdapter: AnalyticsAdapter | null = null;

const getPostHogClient = (): PostHog | null => {
  if (!env.POSTHOG_API_KEY) return null;
  posthogClient ??= new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
  });
  return posthogClient;
};

const defaultAdapter: AnalyticsAdapter = {
  async capture(payload) {
    const posthog = getPostHogClient();
    if (!posthog) return;
    posthog.capture({
      distinctId: payload.distinctId,
      event: payload.event,
      properties: payload.properties,
    });
    await posthog.flush();
  },
  async getFeatureFlag(flag, distinctId) {
    const posthog = getPostHogClient();
    if (!posthog) return undefined;
    return posthog.getFeatureFlag(flag, distinctId);
  },
};

/** Inject a fake analytics adapter in tests; production code never calls this. */
export function __setAnalyticsAdapterForTests(adapter: AnalyticsAdapter | null): void {
  testAdapter = adapter;
}

/**
 * Server-side event capture. Money, signup and AI events must use this so ad
 * blockers cannot drop them. Without POSTHOG_API_KEY it is a dormant no-op.
 */
export async function trackServer(input: AnalyticsPayload): Promise<{ tracked: boolean }> {
  const parsed = analyticsPayloadSchema.safeParse(input);
  if (!parsed.success) return { tracked: false };

  const activeAdapter = testAdapter ?? (env.POSTHOG_API_KEY ? defaultAdapter : null);
  if (!activeAdapter) return { tracked: false };

  try {
    await activeAdapter.capture({
      distinctId: parsed.data.distinctId ?? "server",
      event: parsed.data.event,
      properties: parsed.data.properties,
    });
    return { tracked: true };
  } catch (error) {
    logError({
      requestId: "analytics",
      event: "analytics.capture_failed",
      error: error instanceof Error ? error.message : "unknown analytics error",
    });
    return { tracked: false };
  }
}

/**
 * Evaluate a feature flag or A/B experiment variant on the server.
 * Returns false when PostHog is unconfigured or unreachable.
 * @public
 */
export async function getFeatureFlag(flag: string, distinctId: string): Promise<boolean | string> {
  const activeAdapter = testAdapter ?? (env.POSTHOG_API_KEY ? defaultAdapter : null);
  if (!activeAdapter) return false;

  try {
    return (await activeAdapter.getFeatureFlag(flag, distinctId)) ?? false;
  } catch (error) {
    logError({
      requestId: "analytics",
      event: "analytics.flag_failed",
      error: error instanceof Error ? error.message : "unknown flag error",
    });
    return false;
  }
}
