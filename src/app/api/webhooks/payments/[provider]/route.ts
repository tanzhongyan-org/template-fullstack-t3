import { handlePaymentWebhook } from "~/server/payments/webhook";

/**
 * Provider-agnostic payment webhook route. Delegates verification and
 * normalized event handling to the matching adapter in `src/server/payments/`.
 */
export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handlePaymentWebhook(request, provider);
}
