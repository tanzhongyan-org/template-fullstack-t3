import { createHmac, timingSafeEqual } from "node:crypto";
import { trackServer } from "~/server/analytics";
import { readRawBody } from "~/server/api/parse";
import { db } from "~/server/db";
import { webhookEvents } from "~/server/db/schema";
import { logError, logRequest, requestIdFrom } from "~/server/log";
import { env } from "~/shared/config/env";

/**
 * Payment webhooks with exactly-once effects. Verifies the Stripe signature on
 * the raw body, then inserts the event id in the same transaction as the
 * effect; a replayed event finds the row and returns 2xx without a second
 * effect.
 *
 * TEMPLATE-TODO(payments): add the stripe SDK for checkout and the portal;
 * this route keeps the webhook side, which already verifies and dedupes.
 */

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

const verifyStripeSignature = (rawBody: string, header: string | null): boolean => {
  if (!env.STRIPE_WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2)));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const applyEffect = async (event: StripeEvent): Promise<void> => {
  if (event.type === "checkout.session.completed") {
    await trackServer({
      event: "subscription_started",
      distinctId: String(event.data.object.customer ?? "unknown"),
      properties: { session: String(event.data.object.id ?? "") },
    });
  }
  if (event.type === "customer.subscription.deleted") {
    await trackServer({
      event: "subscription_cancelled",
      distinctId: String(event.data.object.customer ?? "unknown"),
    });
  }
};

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Webhooks are not configured" }, { status: 503 });
  }
  const rawBody = await readRawBody(request);
  if (rawBody instanceof Response) return rawBody;
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) {
    logError({ requestId, event: "webhook", status: 400, error: "bad signature" });
    return Response.json({ error: "Bad signature" }, { status: 400 });
  }
  const event = JSON.parse(rawBody) as StripeEvent;
  if (typeof event.id !== "string" || typeof event.type !== "string") {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({
        provider: "stripe",
        eventId: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: "received",
      })
      .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
      .returning({ id: webhookEvents.id });
    if (inserted.length > 0) {
      await applyEffect(event);
    }
  });
  logRequest({ requestId, event: "webhook", status: 200 });
  return Response.json({ received: true }, { headers: { "x-request-id": requestId } });
}
