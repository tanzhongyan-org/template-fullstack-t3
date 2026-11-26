import { afterEach, describe, expect, it, vi } from "vitest";
import { getPaymentProvider, listPaymentProviders, registerPaymentProvider } from "./index";
import { handlePaymentWebhook } from "./webhook";

describe("payment provider registry and webhook routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("registers and resolves payment providers", () => {
    expect(listPaymentProviders()).toContain("stripe");
    expect(getPaymentProvider("stripe")?.name).toBe("stripe");
    expect(getPaymentProvider("unknown-gateway")).toBeNull();

    registerPaymentProvider({
      name: "mock-gateway",
      isConfigured: () => false,
      createCheckout: async () => ({ checkoutUrl: "https://example.test", sessionId: "s" }),
      createBillingPortal: async () => ({ portalUrl: "https://example.test/portal" }),
      verifyWebhook: () => ({ ok: false, status: 503, reason: "Unconfigured" }),
    });
    expect(listPaymentProviders()).toContain("mock-gateway");
  });

  it("returns 404 for an unknown provider and 503 for an unconfigured provider", async () => {
    const unknownRes = await handlePaymentWebhook(
      new Request("http://localhost/api/webhooks/payments/nope", { method: "POST", body: "{}" }),
      "nope",
    );
    expect(unknownRes.status).toBe(404);

    const mockRes = await handlePaymentWebhook(
      new Request("http://localhost/api/webhooks/payments/mock-gateway", {
        method: "POST",
        body: "{}",
      }),
      "mock-gateway",
    );
    expect(mockRes.status).toBe(503);
  });
});
