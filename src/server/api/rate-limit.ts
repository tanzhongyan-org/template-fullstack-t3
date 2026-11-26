import { env } from "~/shared/config/env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check: (key: string) => RateLimitResult;
  reset: () => void;
}

export interface RateLimiterOptions {
  /** Maximum requests allowed inside `windowMs`. */
  limit: number;
  /** Sliding window size in milliseconds. */
  windowMs: number;
  /** Maximum distinct keys tracked in memory before oldest eviction. */
  maxKeys?: number;
  /** Optional clock override for deterministic tests. */
  now?: () => number;
}

/**
 * Bounded in-memory sliding-window rate limiter. Suitable for single-instance
 * routes and burst control; swap for a Redis-backed RateLimiter when scaling
 * across multiple regions.
 */
export function createMemoryRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = () => Date.now(),
}: RateLimiterOptions): RateLimiter {
  if (limit <= 0 || windowMs <= 0 || maxKeys <= 0) {
    throw new Error("RateLimiter limit, windowMs, and maxKeys must be positive.");
  }

  const buckets = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const nowMs = now();
      const cutoff = nowMs - windowMs;
      const existing = buckets.get(key);
      const recent = existing ? existing.filter((stamp) => stamp > cutoff) : [];

      if (recent.length >= limit) {
        buckets.delete(key);
        buckets.set(key, recent);
        const oldest = recent[0] ?? nowMs;
        const resetAtMs = oldest + windowMs;
        return {
          allowed: false,
          remaining: 0,
          resetAtMs,
          retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000)),
        };
      }

      if (!buckets.has(key) && buckets.size >= maxKeys) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }

      recent.push(nowMs);
      buckets.delete(key);
      buckets.set(key, recent);
      const oldest = recent[0] ?? nowMs;
      return {
        allowed: true,
        remaining: Math.max(0, limit - recent.length),
        resetAtMs: oldest + windowMs,
        retryAfterSeconds: 0,
      };
    },
    reset() {
      buckets.clear();
    },
  };
}

export interface ClientIpOptions {
  /** Number of trusted reverse-proxy hops appending to `x-forwarded-for`. Defaults to 1. */
  trustedProxyHops?: number;
  /**
   * Trusted edge platform whose single-hop IP header may be read:
   * - `"auto"` (default): trusts `x-vercel-forwarded-for` / `x-real-ip` only when `env.VERCEL_ENV` is set; otherwise reads `x-forwarded-for` from the right.
   * - `"vercel"`: trusts `x-vercel-forwarded-for` (rightmost) then `x-real-ip`.
   * - `"cloudflare"`: trusts `cf-connecting-ip`.
   * - `"none"`: ignores platform headers and reads `x-forwarded-for` from the right (falling back to `x-real-ip` only if XFF is absent).
   */
  trustPlatform?: "auto" | "vercel" | "cloudflare" | "none";
}

const splitHeaderValues = (raw: string | null): string[] =>
  raw
    ? raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

/**
 * Extract the caller IP from reverse-proxy headers without trusting spoofed
 * leftmost `x-forwarded-for` entries or unverified edge headers. Self-hosted
 * deployments behind Nginx/Caddy must ensure the proxy appends the client IP
 * to `x-forwarded-for` and strips untrusted headers.
 */
export function clientIpFrom(headers: Headers, options: number | ClientIpOptions = 1): string {
  const { trustedProxyHops = 1, trustPlatform = "auto" } =
    typeof options === "number" ? { trustedProxyHops: options } : options;
  const platform = trustPlatform === "auto" ? (env.VERCEL_ENV ? "vercel" : "none") : trustPlatform;

  if (platform === "cloudflare") {
    const cfIp = headers.get("cf-connecting-ip")?.trim();
    if (cfIp) return cfIp;
  }

  if (platform === "vercel") {
    const vercelParts = splitHeaderValues(headers.get("x-vercel-forwarded-for"));
    const pickedVercel = vercelParts[vercelParts.length - 1];
    if (pickedVercel) return pickedVercel;

    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  const forwardedParts = splitHeaderValues(headers.get("x-forwarded-for"));
  if (forwardedParts.length > 0) {
    const hops = Number.isFinite(trustedProxyHops) ? Math.max(1, Math.floor(trustedProxyHops)) : 1;
    const picked = forwardedParts[Math.max(0, forwardedParts.length - hops)];
    if (picked) return picked;
  }

  const realIpFallback = headers.get("x-real-ip")?.trim();
  return realIpFallback || "unknown";
}

/** Standard HTTP 429 response carrying Retry-After and the request id. */
export function rateLimitResponse(result: RateLimitResult, requestId: string): Response {
  return Response.json(
    { error: "Too many requests", requestId },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
        "x-request-id": requestId,
      },
    },
  );
}
