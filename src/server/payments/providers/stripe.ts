import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "~/shared/config/env";
import type { NormalizedPaymentEvent, PaymentEventType, PaymentProvider } from "../types";

const STRIPE_TOLERANCE_SECONDS = 300;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const EVENT_TYPE_MAP: Record<string, PaymentEventType> = {
  "checkout.session.completed": "checkout.completed",
  "customer.subscription.deleted": "subscription.cancelled",
  "charge.refunded": "payment.refunded",
  "charge.dispute.created": "payment.disputed",
};

const MONEY_EVENT_TYPES = new Set<PaymentEventType>([
  "checkout.completed",
  "payment.refunded",
  "payment.disputed",
]);

const normalizeStripeEvent = (parsed: {
  id: string;
  type: string;
  data?: unknown;
}): { ok: true; event: NormalizedPaymentEvent } | { ok: false; status: 400; reason: string } => {
  const type: PaymentEventType = EVENT_TYPE_MAP[parsed.type] ?? "unhandled";
  const obj = isRecord(parsed.data) && isRecord(parsed.data.object) ? parsed.data.object : {};
  const customerId =
    typeof obj.customer === "string" && obj.customer.length > 0 ? obj.customer : null;
  const rawAmount = obj.amount_total ?? obj.amount_refunded ?? obj.amount;

  let amountMinor: number | null = null;
  let currency: string | null = null;

  if (MONEY_EVENT_TYPES.has(type)) {
    if (typeof rawAmount !== "number" || !Number.isSafeInteger(rawAmount) || rawAmount < 0) {
      return { ok: false, status: 400, reason: "Invalid integer minor amount" };
    }
    if (typeof obj.currency !== "string" || !/^[a-zA-Z]{3}$/.test(obj.currency)) {
      return { ok: false, status: 400, reason: "Missing or invalid currency" };
    }
    amountMinor = rawAmount;
    currency = obj.currency.toUpperCase();
  }

  const sessionId = typeof obj.id === "string" && obj.id.length > 0 ? obj.id : undefined;

  return {
    ok: true,
    event: {
      eventId: parsed.id,
      provider: "stripe",
      type,
      rawType: parsed.type,
      customerId,
      amountMinor,
      currency,
      sessionId,
      payload: parsed as Record<string, unknown>,
    },
  };
};

/**
 * Stripe PaymentProvider adapter. Verifies HMAC-SHA256 webhook signatures with
 * a 5-minute replay tolerance and multi-`v1` secret rotation support.
 */
export const stripeProvider: PaymentProvider = {
  name: "stripe",

  isConfigured: () => Boolean(env.STRIPE_WEBHOOK_SECRET),

  async createCheckout() {
    throw new Error(
      "TEMPLATE-TODO(payments): wire Stripe Checkout or swap PaymentProvider (see docs/recipes/payments.md).",
    );
  },

  async createBillingPortal() {
    throw new Error(
      "TEMPLATE-TODO(payments): wire Stripe Billing Portal or swap PaymentProvider (see docs/recipes/payments.md).",
    );
  },

  verifyWebhook(rawBody: string, headers: Headers, nowSeconds = Math.floor(Date.now() / 1000)) {
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return { ok: false, status: 503, reason: "Webhooks are not configured" };
    }

    const header = headers.get("stripe-signature");
    if (!header) {
      return { ok: false, status: 400, reason: "Missing signature" };
    }

    let timestamp: string | undefined;
    const signatures: string[] = [];
    for (const part of header.split(",")) {
      const idx = part.indexOf("=");
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key === "t" && val) timestamp = val;
      if (key === "v1" && val) signatures.push(val);
    }

    if (!timestamp || signatures.length === 0) {
      return { ok: false, status: 400, reason: "Malformed signature header" };
    }

    const tsNumber = Number(timestamp);
    if (!Number.isInteger(tsNumber) || Math.abs(nowSeconds - tsNumber) > STRIPE_TOLERANCE_SECONDS) {
      return { ok: false, status: 400, reason: "Signature timestamp outside tolerance" };
    }

    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const expectedBuf = Buffer.from(expected);
    const matches = signatures.some((sig) => {
      const actualBuf = Buffer.from(sig);
      return actualBuf.length === expectedBuf.length && timingSafeEqual(actualBuf, expectedBuf);
    });
    if (!matches) {
      return { ok: false, status: 400, reason: "Bad signature" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { ok: false, status: 400, reason: "Invalid JSON payload" };
    }

    if (!isRecord(parsed) || typeof parsed.id !== "string" || typeof parsed.type !== "string") {
      return { ok: false, status: 400, reason: "Invalid event" };
    }

    return normalizeStripeEvent({ id: parsed.id, type: parsed.type, data: parsed.data });
  },
};
