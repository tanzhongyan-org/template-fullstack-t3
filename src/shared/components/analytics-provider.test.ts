import { describe, expect, it } from "vitest";
import { resolvePostHogAssetsUrl } from "./analytics-provider";

describe("resolvePostHogAssetsUrl", () => {
  it("maps official US and EU PostHog cloud hosts by exact hostname", () => {
    expect(resolvePostHogAssetsUrl("https://us.i.posthog.com")).toBe(
      "https://us-assets.i.posthog.com/static/array.js",
    );
    expect(resolvePostHogAssetsUrl("https://eu.i.posthog.com/")).toBe(
      "https://eu-assets.i.posthog.com/static/array.js",
    );
  });

  it("supports custom reverse proxies with optional subpaths", () => {
    expect(resolvePostHogAssetsUrl("https://metrics.example.com")).toBe(
      "https://metrics.example.com/static/array.js",
    );
    expect(resolvePostHogAssetsUrl("https://example.com/ingest/")).toBe(
      "https://example.com/ingest/static/array.js",
    );
  });

  it("does not treat spoofed host substrings or paths as PostHog cloud", () => {
    expect(resolvePostHogAssetsUrl("https://evil.test/us.i.posthog.com")).toBe(
      "https://evil.test/us.i.posthog.com/static/array.js",
    );
    expect(resolvePostHogAssetsUrl("https://us.i.posthog.com.evil.test")).toBe(
      "https://us.i.posthog.com.evil.test/static/array.js",
    );
  });

  it("rejects malformed or non-HTTP URLs", () => {
    expect(resolvePostHogAssetsUrl("javascript:alert(1)")).toBeNull();
    expect(resolvePostHogAssetsUrl("not-a-url")).toBeNull();
  });
});
