import { logError } from "~/server/log";
import { env } from "~/shared/config/env";

export interface ErrorReportContext {
  requestId: string;
  path?: string;
  method?: string;
  digest?: string;
}

export interface ParsedSentryDsn {
  envelopeUrl: string;
  publicKey: string;
  dsn: string;
}

export type ErrorReporterTransport = (request: {
  url: string;
  headers: Record<string, string>;
  body: string;
}) => Promise<void>;

let testTransport: ErrorReporterTransport | null = null;

/** Inject a fake HTTP transport in unit tests; production code never calls this. */
export function __setErrorReporterTransportForTests(
  transport: ErrorReporterTransport | null,
): void {
  testTransport = transport;
}

/** Parse a Sentry DSN into its HTTP envelope endpoint and public key. */
export function parseSentryDsn(dsn: string): ParsedSentryDsn | null {
  try {
    const parsed = new URL(dsn);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.username) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const projectId = segments.pop();
    if (!projectId || !/^\d+$/.test(projectId)) return null;
    const prefix = segments.length > 0 ? `/${segments.join("/")}` : "";
    return {
      envelopeUrl: `${parsed.protocol}//${parsed.host}${prefix}/api/${projectId}/envelope/`,
      publicKey: parsed.username,
      dsn,
    };
  } catch {
    return null;
  }
}

const defaultTransport: ErrorReporterTransport = async ({ url, headers, body }) => {
  await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(5_000),
  });
};

/**
 * Forward unexpected server errors to Sentry when SENTRY_DSN is set.
 * Dormant no-op when unconfigured; transport errors never rethrow.
 */
export async function reportServerError(
  error: unknown,
  context: ErrorReportContext,
): Promise<{ reported: boolean }> {
  const dsn = env.SENTRY_DSN;
  if (!dsn) return { reported: false };
  const target = parseSentryDsn(dsn);
  if (!target) return { reported: false };

  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const sentAt = new Date().toISOString();
  const tags: Record<string, string> = { requestId: context.requestId };
  if (context.path) tags.path = context.path;
  if (context.method) tags.method = context.method;
  if (context.digest) tags.digest = context.digest;

  const eventPayload = {
    event_id: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    platform: "javascript",
    level: "error",
    environment: env.VERCEL_ENV ?? env.NODE_ENV,
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
        },
      ],
    },
    tags,
  };

  const body = [
    JSON.stringify({ dsn: target.dsn, sent_at: sentAt }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(eventPayload),
  ].join("\n");

  const headers = {
    "Content-Type": "application/x-sentry-envelope",
    "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=template-fullstack-t3/0.1, sentry_key=${target.publicKey}`,
  };

  try {
    const transport = testTransport ?? defaultTransport;
    await transport({ url: target.envelopeUrl, headers, body });
    return { reported: true };
  } catch (reportErr) {
    logError({
      requestId: context.requestId,
      event: "error_reporter.failed",
      error: reportErr instanceof Error ? reportErr.message : "unknown error",
    });
    return { reported: false };
  }
}
