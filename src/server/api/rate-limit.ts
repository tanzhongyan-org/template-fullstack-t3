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

/** Extract the caller IP from reverse-proxy headers, falling back cleanly. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
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
