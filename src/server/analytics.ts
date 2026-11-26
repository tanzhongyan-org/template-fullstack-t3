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
  if (!posthogClient) {
    const client = new PostHog(env.POSTHOG_API_KEY, {
      host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
    });
    // Delivery failures in posthog-node v6 emit on 'error' instead of rejecting flush().
    client.on("error", (error: unknown) => {
      logError({
        requestId: "analytics",
        event: "analytics.client_error",
        error: error instanceof Error ? error.message : "unknown analytics error",
      });
    });
    posthogClient = client;
  }
  return posthogClient;
};

const defaultAdapter: AnalyticsAdapter = {
  async capture(payload) {
    const posthog = getPostHogClient();
    if (!posthog) return;
    const { $process_person_profile: processPersonProfile, ...restProperties } =
      payload.properties ?? {};
    const hasRestProperties = Object.keys(restProperties).length > 0;
    posthog.capture({
      distinctId: payload.distinctId,
      event: payload.event,
      ...(hasRestProperties ? { properties: restProperties } : {}),
      ...(typeof processPersonProfile === "boolean"
        ? { options: { process_person_profile: processPersonProfile } }
        : {}),
    });
    await posthog.flush();
  },
  async getFeatureFlag(flag, distinctId) {
    const posthog = getPostHogClient();
    if (!posthog) return undefined;
    const flags = await posthog.evaluateFlags(distinctId, { flagKeys: [flag] });
    return flags.getFlag(flag);
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
export async function trackServer(
  input: AnalyticsPayload & { processPersonProfile?: boolean },
): Promise<{ tracked: boolean }> {
  const parsed = analyticsPayloadSchema.safeParse(input);
  if (!parsed.success) return { tracked: false };

  const activeAdapter = testAdapter ?? (env.POSTHOG_API_KEY ? defaultAdapter : null);
  if (!activeAdapter) return { tracked: false };

  const properties =
    input.processPersonProfile === false
      ? { ...parsed.data.properties, $process_person_profile: false }
      : parsed.data.properties;

  try {
    await activeAdapter.capture({
      distinctId: parsed.data.distinctId ?? "server",
      event: parsed.data.event,
      properties,
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
