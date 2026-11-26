import { reportServerError } from "~/server/error-reporter";
import { logError, logRequest } from "~/server/log";
import { env } from "~/shared/config/env";

/** Next.js server boot hook; emits a structured startup signal. */
export async function register() {
  if (env.NODE_ENV !== "test") {
    logRequest({
      requestId: "boot",
      event: "server.start",
      sentryEnabled: Boolean(env.SENTRY_DSN),
    });
  }
}

/** Next.js request error hook; logs structured JSON and forwards to Sentry when SENTRY_DSN is set. */
export async function onRequestError(
  error: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  },
) {
  const rawHeader = request.headers["x-request-id"];
  const requestId =
    (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.trim() || crypto.randomUUID();

  logError({
    requestId,
    event: "request.error",
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    digest: error.digest,
    error: error.message,
  });

  await reportServerError(error, {
    requestId,
    path: request.path,
    method: request.method,
    digest: error.digest,
  });
}
