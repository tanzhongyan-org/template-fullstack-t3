import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stripeProvider } from "./stripe";

const SECRET = "whsec_test_secret";

const signAt = (body: string, timestamp: number, secret = SECRET): string =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

describe("stripe payment provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verifies a valid signature and normalizes checkout.session.completed", () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123", customer: "cus_123", amount_total: 1999, currency: "sgd" } },
    });
    const header = `t=${now},v1=${signAt(body, now)}`;
    const result = stripeProvider.verifyWebhook(
      body,
      new Headers({ "stripe-signature": header }),
      now,
    );

    expect(result).toEqual({
      ok: true,
      event: expect.objectContaining({
        eventId: "evt_123",
        provider: "stripe",
        type: "checkout.completed",
        rawType: "checkout.session.completed",
        customerId: "cus_123",
        amountMinor: 1999,
        currency: "SGD",
        sessionId: "cs_123",
      }),
    });
  });

  it("accepts rotated signatures when a second v1 matches", () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({
      id: "evt_rot",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_rot" } },
    });
    const header = `t=${now},v1=deadbeef,v1=${signAt(body, now)}`;
    const result = stripeProvider.verifyWebhook(
      body,
      new Headers({ "stripe-signature": header }),
      now,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.type).toBe("subscription.cancelled");
    }
  });

  it("normalizes refund and dispute events", () => {
    const now = 1_700_000_000;
    const refundBody = JSON.stringify({
      id: "evt_ref",
      type: "charge.refunded",
      data: { object: { customer: "cus_1", amount_refunded: 500, currency: "usd" } },
    });
    const refund = stripeProvider.verifyWebhook(
      refundBody,
      new Headers({ "stripe-signature": `t=${now},v1=${signAt(refundBody, now)}` }),
      now,
    );
    expect(refund.ok).toBe(true);
    if (refund.ok) expect(refund.event.type).toBe("payment.refunded");

    const disputeBody = JSON.stringify({
      id: "evt_disp",
      type: "charge.dispute.created",
      data: { object: { amount: 2500, currency: "eur" } },
    });
    const dispute = stripeProvider.verifyWebhook(
      disputeBody,
      new Headers({ "stripe-signature": `t=${now},v1=${signAt(disputeBody, now)}` }),
      now,
    );
    expect(dispute.ok).toBe(true);
    if (dispute.ok) expect(dispute.event.type).toBe("payment.disputed");
  });

  it("rejects missing header, bad signature, and timestamps outside 5-minute tolerance", () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: {} });

    expect(stripeProvider.verifyWebhook(body, new Headers(), now)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(
      stripeProvider.verifyWebhook(
        body,
        new Headers({ "stripe-signature": `t=${now},v1=00` }),
        now,
      ),
    ).toMatchObject({ ok: false, status: 400 });

    const expiredTs = now - 301;
    expect(
      stripeProvider.verifyWebhook(
        body,
        new Headers({ "stripe-signature": `t=${expiredTs},v1=${signAt(body, expiredTs)}` }),
        now,
      ),
    ).toMatchObject({ ok: false, status: 400 });

    const futureTs = now + 301;
    expect(
      stripeProvider.verifyWebhook(
        body,
        new Headers({ "stripe-signature": `t=${futureTs},v1=${signAt(body, futureTs)}` }),
        now,
      ),
    ).toMatchObject({ ok: false, status: 400 });
  });

  it("returns 400 on malformed JSON or invalid event shape even with a valid signature", () => {
    const now = 1_700_000_000;
    const badJson = "{not-json";
    expect(
      stripeProvider.verifyWebhook(
        badJson,
        new Headers({ "stripe-signature": `t=${now},v1=${signAt(badJson, now)}` }),
        now,
      ),
    ).toMatchObject({ ok: false, status: 400 });

    const missingId = JSON.stringify({ type: "checkout.session.completed" });
    expect(
      stripeProvider.verifyWebhook(
        missingId,
        new Headers({ "stripe-signature": `t=${now},v1=${signAt(missingId, now)}` }),
        now,
      ),
    ).toMatchObject({ ok: false, status: 400 });
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is unset", async () => {
    vi.resetModules();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { stripeProvider: unconfigured } = await import("./stripe");
    expect(unconfigured.isConfigured()).toBe(false);
    expect(unconfigured.verifyWebhook("{}", new Headers())).toMatchObject({
      ok: false,
      status: 503,
    });
  });
});
