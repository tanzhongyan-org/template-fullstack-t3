import { createHmac } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { __setAnalyticsAdapterForTests } from "~/server/analytics";
import { db } from "~/server/db";
import { webhookEvents } from "~/server/db/schema";
import { handlePaymentWebhook } from "~/server/payments/webhook";
import { POST } from "./route";

const sign = (body: string, secret: string, offsetSeconds = 0): string => {
  const timestamp = (Math.floor(Date.now() / 1000) + offsetSeconds).toString();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
};

const postEvent = (body: string, signature: string) =>
  POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body,
    }),
  );

describe("stripe webhook route", () => {
  afterEach(() => {
    __setAnalyticsAdapterForTests(null);
  });

  it("rejects a bad signature and expired timestamps", async () => {
    const badRes = await postEvent('{"id":"evt_bad"}', "t=1,v1=deadbeef");
    expect(badRes.status).toBe(400);

    const body = JSON.stringify({
      id: "evt_stale",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const staleRes = await postEvent(body, sign(body, "whsec_test_secret", -400));
    expect(staleRes.status).toBe(400);
  });

  it("returns 400 on malformed JSON with a valid signature", async () => {
    const badJson = "{invalid-json";
    const res = await postEvent(badJson, sign(badJson, "whsec_test_secret"));
    expect(res.status).toBe(400);
  });

  it("records the event once across replays and runs analytics once outside the transaction", async () => {
    const tracked: string[] = [];
    __setAnalyticsAdapterForTests({
      async capture(payload) {
        tracked.push(`${payload.event}:${payload.distinctId}`);
      },
      async getFeatureFlag() {
        return false;
      },
    });

    const eventId = `evt_${Date.now()}`;
    const body = JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: { id: "cs_test", customer: "cus_test", amount_total: 1500, currency: "sgd" },
      },
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const validSig = createHmac("sha256", "whsec_test_secret")
      .update(`${timestamp}.${body}`)
      .digest("hex");
    const rotatedHeader = `t=${timestamp},v1=deadbeef,v1=${validSig}`;

    const first = await postEvent(body, rotatedHeader);
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ received: true, deduped: false });

    const second = await postEvent(body, rotatedHeader);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ received: true, deduped: true });

    const rows = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, eventId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("processed");
    expect(tracked).toEqual(["subscription_started:cus_test"]);
  });

  it("rolls back idempotency row when transactional onEvent fails so retries process cleanly", async () => {
    const eventId = `evt_rollback_${Date.now()}`;
    const body = JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      data: { object: { customer: "cus_retry", amount_total: 1000, currency: "usd" } },
    });
    const makeReq = () =>
      new Request("http://localhost/api/webhooks/payments/stripe", {
        method: "POST",
        headers: { "stripe-signature": sign(body, "whsec_test_secret") },
        body,
      });

    await expect(
      handlePaymentWebhook(makeReq(), "stripe", {
        onEvent: async () => {
          throw new Error("domain write failed");
        },
      }),
    ).rejects.toThrow("domain write failed");

    const beforeRetry = await db
      .select({ value: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));
    expect(beforeRetry[0]?.value).toBe(0);

    const retryRes = await handlePaymentWebhook(makeReq(), "stripe", {
      onEvent: async () => undefined,
    });
    expect(retryRes.status).toBe(200);
    await expect(retryRes.json()).resolves.toEqual({ received: true, deduped: false });

    const afterRetry = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));
    expect(afterRetry).toHaveLength(1);
    expect(afterRetry[0]?.status).toBe("processed");
  });
});
