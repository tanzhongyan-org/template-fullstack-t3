import { handlePaymentWebhook } from "~/server/payments/webhook";

/**
 * Stripe webhook endpoint kept alongside `/api/webhooks/payments/[provider]`.
 */
export async function POST(request: Request) {
  return handlePaymentWebhook(request, "stripe");
}
