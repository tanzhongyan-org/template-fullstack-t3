export type PaymentEventType =
  | "checkout.completed"
  | "subscription.cancelled"
  | "payment.refunded"
  | "payment.disputed"
  | "unhandled";

export interface NormalizedPaymentEvent {
  eventId: string;
  provider: string;
  type: PaymentEventType;
  rawType: string;
  customerId: string | null;
  /** Integer minor units (e.g. cents); never floating point. Null on non-money events. */
  amountMinor: number | null;
  currency: string | null;
  sessionId?: string;
  payload: Record<string, unknown>;
}

export interface CheckoutParams {
  customerId: string;
  priceId?: string;
  amountMinor?: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface BillingPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface BillingPortalResult {
  portalUrl: string;
}

export type WebhookVerificationResult =
  | { ok: true; event: NormalizedPaymentEvent }
  | { ok: false; status: 400 | 503; reason: string };

/**
 * Provider-agnostic payment gateway contract. Implement this interface in
 * `src/server/payments/providers/<name>.ts` to swap or add global gateways
 * (Stripe, Airwallex, Paddle, Lemon Squeezy, HitPay, Adyen).
 */
export interface PaymentProvider {
  readonly name: string;
  isConfigured: () => boolean;
  createCheckout: (params: CheckoutParams) => Promise<CheckoutResult>;
  createBillingPortal: (params: BillingPortalParams) => Promise<BillingPortalResult>;
  verifyWebhook: (
    rawBody: string,
    headers: Headers,
    nowSeconds?: number,
  ) => WebhookVerificationResult;
}
