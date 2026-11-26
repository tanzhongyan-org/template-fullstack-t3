import {
  analyticsEvents,
  clientAnalyticsEvents,
  serverAnalyticsEvents,
} from "@repo/shared/analytics";
import { afterEach, describe, expect, it, vi } from "vitest";
import { __setAnalyticsAdapterForTests, getFeatureFlag, trackServer } from "~/server/analytics";
import { __resetAnalyticsRateLimitForTests, POST } from "./route";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("analytics route", () => {
  afterEach(() => {
    __setAnalyticsAdapterForTests(null);
    __resetAnalyticsRateLimitForTests();
  });

  it("splits client and server taxonomy events cleanly", () => {
    for (const event of ["activated", "feature_used", "feedback_submitted", "cta_clicked"]) {
      expect(clientAnalyticsEvents.options).toContain(event);
      expect(analyticsEvents.options).toContain(event);
    }
    for (const event of [
      "signup_completed",
      "subscription_started",
      "subscription_cancelled",
      "payment_refunded",
      "payment_disputed",
      "ai_response",
      "ai_feedback",
    ]) {
      expect(serverAnalyticsEvents.options).toContain(event);
      expect(clientAnalyticsEvents.options).not.toContain(event);
      expect(analyticsEvents.options).toContain(event);
    }
  });

  it("accepts a client taxonomy event without a key (dormant no-op)", async () => {
    const response = await post({ event: "activated", properties: { plan: "free" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(await response.json()).toEqual({ tracked: false });
  });

  it("rejects server-only events posted from clients", async () => {
    for (const event of ["subscription_started", "signup_completed", "payment_refunded"]) {
      const response = await post({ event, properties: {} });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid request body" });
    }
  });

  it("rejects an unknown event and malformed JSON", async () => {
    const unknownRes = await post({ event: "made_up", properties: {} });
    expect(unknownRes.status).toBe(400);

    const badJsonRes = await post("{not-json");
    expect(badJsonRes.status).toBe(400);
    expect(await badJsonRes.json()).toEqual({ error: "Invalid JSON" });
  });

  it("derives distinctId server-side per visitor or session and ignores forged client distinctId", async () => {
    const captured: Array<{
      event: string;
      distinctId: string;
      properties?: Record<string, unknown>;
    }> = [];
    __setAnalyticsAdapterForTests({
      async capture(payload) {
        captured.push({
          event: payload.event,
          distinctId: payload.distinctId,
          properties: payload.properties,
        });
      },
      async getFeatureFlag() {
        return "variant-a";
      },
    });

    const anonRes = await post({ event: "activated", distinctId: "forged-admin" });
    expect(anonRes.status).toBe(200);
    expect(await anonRes.json()).toEqual({ tracked: true });

    const setCookie = anonRes.headers.get("set-cookie") ?? "";
    const match = setCookie.match(/anon_id=(anon_[0-9a-f-]+)/i);
    expect(match?.[1]).toBeTruthy();
    const anonId = match?.[1] ?? "";
    expect(anonId).not.toBe("anonymous");
    expect(anonId).not.toBe("forged-admin");

    const secondAnonRes = await post({ event: "cta_clicked" }, { cookie: `anon_id=${anonId}` });
    expect(secondAnonRes.status).toBe(200);
    expect(secondAnonRes.headers.get("set-cookie")).toBeNull();

    const authedRes = await post(
      { event: "feature_used", distinctId: "forged-other" },
      { "x-user-id": "real-user" },
    );
    expect(authedRes.status).toBe(200);

    expect(captured).toEqual([
      {
        event: "activated",
        distinctId: anonId,
        properties: { $process_person_profile: false },
      },
      {
        event: "cta_clicked",
        distinctId: anonId,
        properties: { $process_person_profile: false },
      },
      { event: "feature_used", distinctId: "real-user", properties: undefined },
    ]);
    await expect(getFeatureFlag("checkout-test", "real-user")).resolves.toBe("variant-a");
  });

  it("rate-limits excessive requests per client IP", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    try {
      for (let i = 0; i < 60; i++) {
        const res = await post({ event: "activated" }, { "x-forwarded-for": "198.51.100.42" });
        expect(res.status).toBe(200);
      }
      const blocked = await post({ event: "activated" }, { "x-forwarded-for": "198.51.100.42" });
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    } finally {
      infoSpy.mockRestore();
    }
  });

  it("trackServer drops events without a key", async () => {
    await expect(trackServer({ event: "activated" })).resolves.toEqual({ tracked: false });
  });
});
