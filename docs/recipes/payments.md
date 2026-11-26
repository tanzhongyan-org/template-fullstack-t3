# Global Payments & Low-Value Pricing

The template isolates payments behind the `PaymentProvider` interface in `src/server/payments/types.ts` and routes webhooks through one idempotent engine in `src/server/payments/webhook.ts`. Your product logic works against `NormalizedPaymentEvent` regardless of which global or regional processor you pick.

## Adding or Swapping a Payment Provider

1. Create `src/server/payments/providers/<name>.ts` implementing `PaymentProvider`:
   - `isConfigured()` — returns `true` when required env keys are set.
   - `createCheckout(params)` — returns `{ checkoutUrl, sessionId }`.
   - `createBillingPortal(params)` — returns `{ portalUrl }`.
   - `verifyWebhook(rawBody, headers)` — verifies HMAC/signature + timestamp replay tolerance and maps provider events to `NormalizedPaymentEvent`.
2. Add required secrets to `src/shared/config/env.js`, `.env.example`, and `README.md`, and add the provider key to `PAYMENT_PROVIDER`.
3. Register the provider in `src/server/payments/index.ts`.
4. Point the gateway webhook dashboard at `POST /api/webhooks/payments/<name>`.

Example skeleton for another gateway (e.g., Airwallex, Paddle, Lemon Squeezy, HitPay, or Adyen):

```ts
import type { PaymentProvider } from "../types";

export const customProvider: PaymentProvider = {
  name: "hitpay",
  isConfigured: () => Boolean(process.env.HITPAY_SALT),
  async createCheckout(params) {
    // Call gateway REST API with params.amountMinor (integer cents) and params.currency
    return { checkoutUrl: "https://...", sessionId: "req_..." };
  },
  async createBillingPortal() {
    throw new Error("Portal not supported on one-time rail");
  },
  verifyWebhook(rawBody, headers) {
    // Verify HMAC-SHA256 signature with timingSafeEqual and parse into NormalizedPaymentEvent
    return { ok: false, status: 400, reason: "Implement verification" };
  },
};
```

## Minimizing Fees on High-Volume, Low-Value Transactions

Standard card rails charge a fixed per-transaction fee (for example ~$0.30–$0.50 + ~2.9%–3.4%) which crushes margins on micro-purchases under $5. Two proven ways to protect margins globally:

1. **Prepaid Credit Packs (Gateway-Agnostic):** Sell $10 / $20 / $50 bundles in one checkout, then credit an integer `credit_balance` column inside the `handlePaymentWebhook` Postgres transaction. Individual micro-actions deduct integer credits in Postgres with **$0 gateway fee**.
2. **Local Instant Bank / QR Rails:** Support low-fixed-fee local rails behind your `PaymentProvider` adapter where available (PayNow in Singapore, SEPA/iDEAL in Europe, Pix in Brazil, UPI in India, ACH in the US) while keeping the rest of your app code unchanged.

## Removing Payments Completely

If your app has no billing or paid tiers:

1. Delete `src/server/payments/`, `src/app/api/webhooks/`, and `webhookEvents` from `src/server/db/schema.ts`.
2. Remove `PAYMENT_PROVIDER` and `STRIPE_WEBHOOK_SECRET` from `src/shared/config/env.js`, `.env.example`, and `README.md`.
3. Run `make db-generate && make verify`.
