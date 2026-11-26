# Observability, Error Tracking & Product Analytics

This template splits observability into three clear, swappable layers that stay dormant until you set their environment keys.

## Choosing the Right Tool

- **Vercel Logs / `src/server/log.ts`**: Structured JSON logs with `requestId` (`x-request-id` header) and tRPC timing durations. Best for short-retention debugging.
- **Sentry (`SENTRY_DSN`)**: Captures backend crashes with stack traces, groups recurring failures, and pages Slack/email on spikes (replaces Datadog APM + PagerDuty for lean teams). Pair with Better Stack pinging `/api/health` for uptime alerts.
- **PostHog (`POSTHOG_API_KEY` + `NEXT_PUBLIC_POSTHOG_KEY`)**: Product behavior and UX analytics—funnels, retention cohorts, privacy-masked Session Replay, Click Heatmaps, and A/B Feature Flags. Vercel Analytics only gives macro traffic and cannot provide session replays, heatmaps, or server-guarded conversion events.

## Enabling Sentry

### Option 1: Built-in Zero-Dependency Server Reporting

Paste your DSN into `.env` or Vercel environment variables:

```bash
SENTRY_DSN="https://<public_key>@o0.ingest.sentry.io/<project_id>"
```

`src/instrumentation.ts` (`onRequestError`) and `/api/trpc` (`onError`) automatically forward unexpected server errors via `src/server/error-reporter.ts` with `requestId` and `digest` tags—zero extra npm dependencies.

### Option 2: Full Client Source Maps & Browser Replay

When you want uploaded source maps and client-side React crash breadcrumbs:

1. `bun add @sentry/nextjs` (record in `docs/dependencies.md`).
2. Wrap `next.config.js` with `withSentryConfig` and initialize Sentry inside `src/instrumentation.ts`.

## Enabling PostHog Replays, Heatmaps & A/B Flags

1. Set server key (tamper-proof payments/signup tracking via `trackServer` & `getFeatureFlag`):

   ```bash
   POSTHOG_API_KEY="phc_..."
   POSTHOG_HOST="https://us.i.posthog.com"
   ```

2. Set client keys (`<AnalyticsProvider />` stays completely dormant until `NEXT_PUBLIC_POSTHOG_KEY` is set):

   ```bash
   NEXT_PUBLIC_POSTHOG_KEY="phc_..."
   NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
   NEXT_PUBLIC_POSTHOG_REPLAY="true"
   NEXT_PUBLIC_POSTHOG_HEATMAPS="true"
   ```

3. Read A/B experiment flags cleanly:
   - Server Components / tRPC: `await getFeatureFlag("pricing-v2", userId)` from `src/server/analytics.ts`.
   - Client Components: `useFeatureFlag("pricing-v2", "control")` from `src/shared/components/analytics-provider.tsx`.

## Adding Vercel Speed Insights

If deploying to Vercel and you want real-user Core Web Vitals without adding extra `/api/*` serverless invocations:

1. `bun add @vercel/speed-insights` (record in `docs/dependencies.md`).
2. Render `<SpeedInsights />` from `@vercel/speed-insights/next` inside `src/app/layout.tsx`.
