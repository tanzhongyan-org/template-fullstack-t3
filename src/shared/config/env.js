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
     * rejects every request with UNAUTHORIZED. Set it only behind a gateway that sets the header.
     */
    TRUST_IDENTITY_HEADER: z.stringbool().default(false),
    /** Resend API key. Unset means console email in local development only. */
    RESEND_API_KEY: z.string().min(1).optional(),
    /** Sender address for transactional mail; required when RESEND_API_KEY is set. */
    EMAIL_FROM: z.string().min(1).optional(),
    /** PostHog Cloud project key. Unset disables analytics. */
    POSTHOG_API_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().url().optional(),
    /** Bearer secret guarding /api/cron/*. Unset means crons run in local development only. */
    CRON_SECRET: z.string().min(1).optional(),
    /** Webhook signing secret per environment. Unset means the webhook route answers 503. */
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    /** Turnstile secret for the waitlist form. Unset skips verification in local development. */
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  },

  /**
   * Client-side variables. Prefix each with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
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
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    CRON_SECRET: process.env.CRON_SECRET,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
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
 * Fail closed at boot: the header-identity stub and console email must never
 * run on Vercel production or preview, and mail needs a sender when it is on.
 */
if (
  env.TRUST_IDENTITY_HEADER &&
  (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview")
) {
  throw new Error("TRUST_IDENTITY_HEADER must be false on Vercel production and preview.");
}
if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
  throw new Error("EMAIL_FROM is required when RESEND_API_KEY is set.");
}
