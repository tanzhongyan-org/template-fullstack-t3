"use client";

import Script from "next/script";
import { createContext, useContext, useState } from "react";
import { env, isEnvTrue } from "~/shared/config/env";

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

/**
 * Resolve the PostHog browser array.js bundle URL via strict URL hostname
 * parsing rather than substring checks. Returns null for invalid or non-HTTP URLs.
 */
export function resolvePostHogAssetsUrl(apiHost: string): string | null {
  try {
    const parsed = new URL(apiHost);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.hostname === "eu.i.posthog.com") {
      return "https://eu-assets.i.posthog.com/static/array.js";
    }
    if (parsed.hostname === "us.i.posthog.com") {
      return "https://us-assets.i.posthog.com/static/array.js";
    }
    const basePath = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${basePath}/static/array.js`;
  } catch {
    return null;
  }
}

/**
 * Opt-in client observability provider for session replay, heatmaps, and
 * A/B feature flags. Completely dormant (zero script load) unless
 * NEXT_PUBLIC_POSTHOG_KEY is configured.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, FlagValue>>({});
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const scriptSrc = key ? resolvePostHogAssetsUrl(host) : null;

  if (!key || !scriptSrc) {
    return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
  }

  return (
    <FeatureFlagsContext.Provider value={flags}>
      <Script
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={() => {
          const client = window.posthog;
          if (!client) return;
          client.init(key, {
            api_host: host,
            autocapture: false,
            capture_pageview: false,
            disable_session_recording: !isEnvTrue(env.NEXT_PUBLIC_POSTHOG_REPLAY),
            session_recording: {
              maskAllInputs: true,
              maskTextSelector: "[data-private]",
            },
            enable_heatmaps: isEnvTrue(env.NEXT_PUBLIC_POSTHOG_HEATMAPS),
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
