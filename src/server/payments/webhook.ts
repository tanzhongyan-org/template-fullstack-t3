import { eq } from "drizzle-orm";
import { trackServer } from "~/server/analytics";
import { readRawBody } from "~/server/api/parse";
import { db } from "~/server/db";
import { webhookEvents } from "~/server/db/schema";
import { logError, logRequest, requestIdFrom } from "~/server/log";
import { getPaymentProvider } from "./index";
import type { NormalizedPaymentEvent } from "./types";

export type PaymentWebhookTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface HandlePaymentWebhookOptions {
  /** Domain work executed inside the idempotency Postgres transaction before commit. */
  onEvent?: (tx: PaymentWebhookTx, event: NormalizedPaymentEvent) => Promise<void>;
}

const ANALYTICS_EVENT_BY_TYPE = {
  "checkout.completed": "subscription_started",
  "subscription.cancelled": "subscription_cancelled",
  "payment.refunded": "payment_refunded",
  "payment.disputed": "payment_disputed",
} as const;

async function applyPostCommitEffects(
  event: NormalizedPaymentEvent,
  requestId: string,
): Promise<void> {
  if (event.type === "unhandled") return;
  const analyticsEvent = ANALYTICS_EVENT_BY_TYPE[event.type];
  try {
    const properties: Record<string, string | number | boolean> = {
      provider: event.provider,
    };
    if (event.amountMinor !== null) properties.amountMinor = event.amountMinor;
    if (event.currency !== null) properties.currency = event.currency;
    if (event.sessionId) properties.session = event.sessionId;

    await trackServer({
      event: analyticsEvent,
      distinctId: event.customerId ?? `${event.provider}:${event.eventId}`,
      properties,
      processPersonProfile: event.customerId !== null,
    });
  } catch (error) {
    logError({
      requestId,
      event: "webhook.post_commit_failed",
      provider: event.provider,
      eventId: event.eventId,
      error: error instanceof Error ? error.message : "post-commit error",
    });
  }
}

/**
 * Shared provider-agnostic webhook intake: validates provider and signature,
 * dedupes `(provider, eventId)` inside a Postgres transaction, executes any
 * transactional `onEvent` domain hook, marks the row `processed`, and runs
 * external telemetry strictly after commit.
 */
export async function handlePaymentWebhook(
  request: Request,
  providerName: string,
  options?: HandlePaymentWebhookOptions,
): Promise<Response> {
  const requestId = requestIdFrom(request.headers);
  const provider = getPaymentProvider(providerName);
  if (!provider) {
    return Response.json(
      { error: "Unknown payment provider", requestId },
      { status: 404, headers: { "x-request-id": requestId } },
    );
  }
  if (!provider.isConfigured()) {
    return Response.json(
      { error: "Webhooks are not configured", requestId },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }

  const rawBody = await readRawBody(request);
  if (rawBody instanceof Response) return rawBody;

  const verified = provider.verifyWebhook(rawBody, request.headers);
  if (!verified.ok) {
    logError({
      requestId,
      event: "webhook.rejected",
      provider: provider.name,
      status: verified.status,
      error: verified.reason,
    });
    return Response.json(
      { error: verified.reason, requestId },
      { status: verified.status, headers: { "x-request-id": requestId } },
    );
  }

  const { event } = verified;
  const isFirstDelivery = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({
        provider: event.provider,
        eventId: event.eventId,
        type: event.rawType,
        payload: event.payload,
        status: "received",
      })
      .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
      .returning({ id: webhookEvents.id });

    const row = inserted[0];
    if (!row) return false;

    if (options?.onEvent) {
      await options.onEvent(tx, event);
    }

    await tx.update(webhookEvents).set({ status: "processed" }).where(eq(webhookEvents.id, row.id));

    return true;
  });

  if (isFirstDelivery) {
    await applyPostCommitEffects(event, requestId);
  }

  logRequest({
    requestId,
    event: "webhook",
    provider: event.provider,
    eventType: event.type,
    deduped: !isFirstDelivery,
    status: 200,
  });

  return Response.json(
    { received: true, deduped: !isFirstDelivery },
    { headers: { "x-request-id": requestId } },
  );
}
