"use client";

import Script from "next/script";
import { createContext, useContext, useState } from "react";
import { env } from "~/shared/config/env";

type FlagValue = boolean | string;

interface PostHogBrowserClient {
  init: (key: string, options: Record<string, unknown>) => void;
  onFeatureFlags: (cb: (flags: string[], variants: Record<string, FlagValue>) => void) => void;
}

declare global {
  interface Window {
    posthog?: PostHogBrowserClient;
  }
}

const FeatureFlagsContext = createContext<Record<string, FlagValue>>({});

const assetsScriptUrl = (apiHost: string): string => {
  const clean = apiHost.replace(/\/$/, "");
  if (clean.includes("eu.i.posthog.com")) return "https://eu-assets.i.posthog.com/static/array.js";
  if (clean.includes("us.i.posthog.com")) return "https://us-assets.i.posthog.com/static/array.js";
  return `${clean}/static/array.js`;
};

/**
 * Opt-in client observability provider for session replay, heatmaps, and
 * A/B feature flags. Completely dormant (zero script load) unless
 * NEXT_PUBLIC_POSTHOG_KEY is configured.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, FlagValue>>({});
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!key) {
    return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
  }

  return (
    <FeatureFlagsContext.Provider value={flags}>
      <Script
        src={assetsScriptUrl(host)}
        strategy="afterInteractive"
        onLoad={() => {
          const client = window.posthog;
          if (!client) return;
          client.init(key, {
            api_host: host,
            autocapture: false,
            capture_pageview: false,
            disable_session_recording: !env.NEXT_PUBLIC_POSTHOG_REPLAY,
            session_recording: {
              maskAllInputs: true,
              maskTextSelector: "[data-private]",
            },
            enable_heatmaps: env.NEXT_PUBLIC_POSTHOG_HEATMAPS,
          });
          client.onFeatureFlags((_keys, variants) => {
            setFlags(variants);
          });
        }}
      />
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Read a feature flag or A/B experiment variant from client components.
 * @public
 */
export function useFeatureFlag(flag: string, defaultValue: FlagValue = false): FlagValue {
  const flags = useContext(FeatureFlagsContext);
  return flags[flag] ?? defaultValue;
}
