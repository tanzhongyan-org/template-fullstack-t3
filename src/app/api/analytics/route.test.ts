import { analyticsEvents } from "@repo/shared/analytics";
import { describe, expect, it } from "vitest";
import { trackServer } from "~/server/analytics";
import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("analytics route", () => {
  it("covers the base taxonomy events", () => {
    for (const event of [
      "signup_completed",
      "activated",
      "subscription_started",
      "subscription_cancelled",
      "ai_response",
      "ai_feedback",
    ]) {
      expect(analyticsEvents.options).toContain(event);
    }
  });

  it("accepts a taxonomy event without a key (no-op)", async () => {
    const response = await post({ event: "activated", properties: { plan: "free" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tracked: false });
  });

  it("rejects an unknown event", async () => {
    const response = await post({ event: "made_up", properties: {} });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request body" });
  });

  it("trackServer drops invalid payloads without a key", async () => {
    await expect(trackServer({ event: "activated" })).resolves.toEqual({ tracked: false });
  });
});
