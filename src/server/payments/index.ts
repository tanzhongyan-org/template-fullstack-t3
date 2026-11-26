import { env } from "~/shared/config/env";
import { stripeProvider } from "./providers/stripe";
import type { PaymentProvider } from "./types";

const registry = new Map<string, PaymentProvider>([[stripeProvider.name, stripeProvider]]);

/**
 * Register a custom PaymentProvider adapter at runtime or module init.
 * @public
 */
export function registerPaymentProvider(provider: PaymentProvider): void {
  registry.set(provider.name, provider);
}

/**
 * List all registered payment provider names.
 * @public
 */
export function listPaymentProviders(): string[] {
  return [...registry.keys()];
}

/** Resolve the active or named payment provider adapter. */
export function getPaymentProvider(name: string = env.PAYMENT_PROVIDER): PaymentProvider | null {
  return registry.get(name) ?? null;
}
