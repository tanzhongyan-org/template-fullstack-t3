import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    css: false,
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    env: {
      TRUST_IDENTITY_HEADER: "true",
      CRON_SECRET: "test-cron-secret",
      STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
      "@repo/shared": path.resolve(import.meta.dirname, "./packages/shared"),
    },
  },
});
