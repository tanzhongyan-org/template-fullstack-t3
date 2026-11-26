import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    css: false,
    exclude: ["e2e/**", "node_modules/**", ".next/**", ".worktrees/**"],
    coverage: {
      provider: "v8",
      include: ["src/**", "packages/**/*.ts"],
      exclude: ["**/*.test.*", "**/*.d.ts"],
      thresholds: { lines: 47, branches: 41, functions: 31, statements: 48 },
    },
    env: {
      TRUST_IDENTITY_HEADER: "true",
      CRON_SECRET: "test-cron-secret",
      STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts", "**/*.test.tsx"],
          exclude: ["**/*.db.test.*", "e2e/**", "node_modules/**", ".next/**", ".worktrees/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["**/*.db.test.ts", "**/*.db.test.tsx"],
          exclude: ["e2e/**", "node_modules/**", ".next/**", ".worktrees/**"],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
      "@repo/shared": path.resolve(import.meta.dirname, "./packages/shared"),
    },
  },
});
