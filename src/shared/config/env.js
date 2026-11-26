import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side variables. Reading one that fails validation stops the build and the server.
   */
  server: {
    DATABASE_URL: z.string().url(),
    /** Direct (non-pooled) URL for migrations; falls back to DATABASE_URL. */
    DATABASE_DIRECT_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** Set by Vercel; the dev guard reads it. Unset anywhere else. */
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    /**
     * Honour the `x-user-id` request header as the caller identity. Defaults to false, which
     * rejects every request with UNAUTHORIZED. Must remain false in production and preview.
     */
    TRUST_IDENTITY_HEADER: z.stringbool().default(false),
    /** Comma-separated user IDs granted the `admin` role in getServerSession. */
    ADMIN_USER_IDS: z.string().optional(),
    /** Override PostgreSQL prepared statement behaviour. Defaults to false for pooler URLs. */
    DB_PREPARE_STATEMENTS: z.stringbool().optional(),
    /** Maximum connections in the Postgres pool per server process. */
    DB_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(100).optional(),
    /** Resend API key. Unset means console email in local development only. */
    RESEND_API_KEY: z.string().min(1).optional(),
    /** Sender address for transactional mail; required when RESEND_API_KEY is set. */
    EMAIL_FROM: z.string().min(1).optional(),
    /** PostHog Cloud project key. Unset disables server analytics. */
    POSTHOG_API_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().url().optional(),
    /** Optional Sentry DSN for server error reporting in instrumentation and tRPC onError. */
    SENTRY_DSN: z.string().url().optional(),
    /** Bearer secret guarding /api/cron/*. Unset means crons run in local development only. */
    CRON_SECRET: z.string().min(1).optional(),
    /** Active payment provider adapter key (`src/server/payments/index.ts`). */
    PAYMENT_PROVIDER: z.enum(["stripe"]).default("stripe"),
    /** Stripe webhook signing secret per environment. Unset means the webhook answers 503. */
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  },

  /**
   * Client-side variables. Prefix each with `NEXT_PUBLIC_`.
   */
  client: {
    /** Optional PostHog browser key; enables client AnalyticsProvider when set. */
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    /** Enables privacy-masked PostHog session replay when NEXT_PUBLIC_POSTHOG_KEY is set. */
    NEXT_PUBLIC_POSTHOG_REPLAY: z.stringbool().default(false),
    /** Enables PostHog click heatmaps when NEXT_PUBLIC_POSTHOG_KEY is set. */
    NEXT_PUBLIC_POSTHOG_HEATMAPS: z.stringbool().default(false),
  },

  /**
   * Next.js edge runtimes and client bundles cannot destructure `process.env`, so list each
   * variable here.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    TRUST_IDENTITY_HEADER: process.env.TRUST_IDENTITY_HEADER,
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
    DB_PREPARE_STATEMENTS: process.env.DB_PREPARE_STATEMENTS,
    DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    SENTRY_DSN: process.env.SENTRY_DSN,
    CRON_SECRET: process.env.CRON_SECRET,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_REPLAY: process.env.NEXT_PUBLIC_POSTHOG_REPLAY,
    NEXT_PUBLIC_POSTHOG_HEATMAPS: process.env.NEXT_PUBLIC_POSTHOG_HEATMAPS,
  },
  /**
   * Set `SKIP_ENV_VALIDATION` to skip validation, for example in Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Treat empty strings as undefined, so `SOME_VAR=''` fails a required variable.
   */
  emptyStringAsUndefined: true,
});

/**
 * Interpret a boolean env flag safely even when SKIP_ENV_VALIDATION leaves raw strings.
 * @param {unknown} value
 * @returns {boolean}
 */
export const isEnvTrue = (value) => value === true || value === "true";

/**
 * Fail closed at boot on the server: the header-identity stub must never run in
 * production or preview environments (Docker/self-host or Vercel), and mail
 * needs a sender when it is on.
 */
if (typeof window === "undefined") {
  const trustHeader = isEnvTrue(env.TRUST_IDENTITY_HEADER);
  const isVercelProdOrPreview = env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
  const isRuntimeProd = env.NODE_ENV === "production" && process.env.NEXT_BUILDING !== "1";
  if (trustHeader && (isVercelProdOrPreview || isRuntimeProd)) {
    throw new Error("TRUST_IDENTITY_HEADER must be false in production and preview environments.");
  }
  if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is required when RESEND_API_KEY is set.");
  }
}
