import { clientAnalyticsPayloadSchema } from "@repo/shared/analytics";
import { trackServer } from "~/server/analytics";
import { parseJsonBody } from "~/server/api/parse";
import { clientIpFrom, createMemoryRateLimiter, rateLimitResponse } from "~/server/api/rate-limit";
import { getServerSession } from "~/server/auth";
import { logRequest, requestIdFrom } from "~/server/log";

const analyticsLimiter = createMemoryRateLimiter({ limit: 60, windowMs: 60_000 });

/** Reset the analytics route rate limiter in unit tests. */
export function __resetAnalyticsRateLimitForTests(): void {
  analyticsLimiter.reset();
}

/**
 * Client event intake. Rate-limits by IP, validates against the client-only
 * taxonomy, derives identity server-side, and forwards via trackServer().
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  const limit = analyticsLimiter.check(clientIpFrom(request.headers));
  if (!limit.allowed) {
    return rateLimitResponse(limit, requestId);
  }

  const parsed = await parseJsonBody(request, clientAnalyticsPayloadSchema);
  if (parsed instanceof Response) return parsed;

  const session = await getServerSession(request.headers);
  const { tracked } = await trackServer({
    event: parsed.event,
    distinctId: session?.id ?? "anonymous",
    properties: parsed.properties,
  });

  logRequest({ requestId, event: "analytics", status: 200 });
  return Response.json({ tracked }, { headers: { "x-request-id": requestId } });
}
