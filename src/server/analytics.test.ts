import { afterEach, describe, expect, it, vi } from "vitest";

describe("server analytics (posthog-node v6)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock("posthog-node");
    vi.doUnmock("~/shared/config/env");
  });

  it("registers an error listener, lifts process_person_profile into options, and uses evaluateFlags", async () => {
    const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    const capture = vi.fn();
    const flush = vi.fn().mockResolvedValue(undefined);
    const getFlag = vi.fn().mockReturnValue("variant-b");
    const evaluateFlags = vi.fn().mockResolvedValue({ getFlag });
    const on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const list = listeners.get(event) ?? [];
      list.push(cb);
      listeners.set(event, list);
      return () => {};
    });
    const ctorArgs: Array<{ apiKey: string; options?: Record<string, unknown> }> = [];

    class FakePostHog {
      on = on;
      capture = capture;
      flush = flush;
      evaluateFlags = evaluateFlags;
      constructor(apiKey: string, options?: Record<string, unknown>) {
        ctorArgs.push({ apiKey, options });
      }
    }

    vi.doMock("posthog-node", () => ({ PostHog: FakePostHog }));
    vi.doMock("~/shared/config/env", () => ({
      env: {
        POSTHOG_API_KEY: "phc_test_key",
        POSTHOG_HOST: "https://us.i.posthog.com",
      },
    }));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { getFeatureFlag, trackServer } = await import("~/server/analytics");

    await expect(
      trackServer({
        event: "activated",
        distinctId: "anon_1",
        properties: { plan: "free" },
        processPersonProfile: false,
      }),
    ).resolves.toEqual({ tracked: true });

    expect(ctorArgs).toEqual([
      {
        apiKey: "phc_test_key",
        options: { host: "https://us.i.posthog.com", flushAt: 1 },
      },
    ]);
    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(capture).toHaveBeenCalledWith({
      distinctId: "anon_1",
      event: "activated",
      properties: { plan: "free" },
      options: { process_person_profile: false },
    });
    expect(flush).toHaveBeenCalledTimes(1);

    await expect(
      trackServer({
        event: "cta_clicked",
        distinctId: "anon_2",
        processPersonProfile: false,
      }),
    ).resolves.toEqual({ tracked: true });

    // Singleton client reused without re-registering listeners; empty properties omitted.
    expect(ctorArgs).toHaveLength(1);
    expect(capture).toHaveBeenLastCalledWith({
      distinctId: "anon_2",
      event: "cta_clicked",
      options: { process_person_profile: false },
    });

    // Emitting on 'error' logs structured client_error without throwing.
    const errorHandlers = listeners.get("error") ?? [];
    expect(errorHandlers).toHaveLength(1);
    for (const handler of errorHandlers) {
      handler(new Error("delivery failed"));
    }
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const firstLogArg = errorSpy.mock.calls[0]?.[0];
    expect(typeof firstLogArg).toBe("string");
    const logged = JSON.parse(String(firstLogArg)) as Record<string, unknown>;
    expect(logged).toMatchObject({
      level: "error",
      requestId: "analytics",
      event: "analytics.client_error",
      error: "delivery failed",
    });

    await expect(getFeatureFlag("checkout-test", "user_1")).resolves.toBe("variant-b");
    expect(evaluateFlags).toHaveBeenCalledWith("user_1", { flagKeys: ["checkout-test"] });

    getFlag.mockReturnValueOnce(undefined);
    await expect(getFeatureFlag("missing-flag", "user_1")).resolves.toBe(false);

    evaluateFlags.mockRejectedValueOnce(new Error("flag service down"));
    await expect(getFeatureFlag("failing-flag", "user_1")).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("logs client_error without rejecting when real posthog-node v6 delivery returns HTTP 400", async () => {
    vi.doMock("~/shared/config/env", () => ({
      env: {
        POSTHOG_API_KEY: "phc_test_key",
        POSTHOG_HOST: "http://127.0.0.1:1",
      },
    }));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { trackServer } = await import("~/server/analytics");
    await expect(
      trackServer({ event: "activated", distinctId: "user_1", processPersonProfile: false }),
    ).resolves.toEqual({ tracked: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestUrl = String(fetchSpy.mock.calls[0]?.[0] ?? "");
    expect(requestUrl.endsWith("/i/v1/analytics/events")).toBe(true);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(errorSpy.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(logged).toMatchObject({
      level: "error",
      requestId: "analytics",
      event: "analytics.client_error",
    });
    expect(String(logged.error)).toContain("did not fully deliver");
  });
});
