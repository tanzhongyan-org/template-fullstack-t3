import { clientAnalyticsPayloadSchema } from "@repo/shared/analytics";
import { trackServer } from "~/server/analytics";
import { parseJsonBody } from "~/server/api/parse";
import { clientIpFrom, createMemoryRateLimiter, rateLimitResponse } from "~/server/api/rate-limit";
import { getServerSession } from "~/server/auth";
import { logRequest, requestIdFrom } from "~/server/log";
import { env } from "~/shared/config/env";

const analyticsLimiter = createMemoryRateLimiter({ limit: 60, windowMs: 60_000 });
const ANON_COOKIE_NAME = "anon_id";
const ANON_ID_RE = /^anon_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readAnonCookie(headers: Headers): string | null {
  const rawCookie = headers.get("cookie");
  if (!rawCookie) return null;
  for (const part of rawCookie.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    if (part.slice(0, eqIdx).trim() !== ANON_COOKIE_NAME) continue;
    const value = part.slice(eqIdx + 1).trim();
    return ANON_ID_RE.test(value) ? value : null;
  }
  return null;
}

/** Reset the analytics route rate limiter in unit tests. */
export function __resetAnalyticsRateLimitForTests(): void {
  analyticsLimiter.reset();
}

/**
 * Client event intake. Rate-limits by IP, validates against the client-only
 * taxonomy, derives a per-session or per-visitor anonymous id server-side, and
 * forwards via trackServer().
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
  const existingAnonId = session ? null : readAnonCookie(request.headers);
  const generatedAnonId = session || existingAnonId ? null : `anon_${crypto.randomUUID()}`;
  const distinctId = session?.id ?? existingAnonId ?? generatedAnonId ?? "anon_fallback";

  const { tracked } = await trackServer({
    event: parsed.event,
    distinctId,
    properties: parsed.properties,
    processPersonProfile: Boolean(session),
  });

  const headers = new Headers({ "x-request-id": requestId });
  if (generatedAnonId) {
    const secure =
      env.NODE_ENV === "production" || request.url.startsWith("https:") ? "; Secure" : "";
    headers.set(
      "set-cookie",
      `${ANON_COOKIE_NAME}=${generatedAnonId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`,
    );
  }

  logRequest({ requestId, event: "analytics", status: 200 });
  return Response.json({ tracked }, { headers });
}
