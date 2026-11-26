import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIpFrom, createMemoryRateLimiter, rateLimitResponse } from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rate limiter", () => {
  it("allows up to limit and rejects the next request until the window expires", () => {
    let clock = 1_000;
    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 10_000, now: () => clock });

    const first = limiter.check("ip-1");
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    clock += 1_000;
    const second = limiter.check("ip-1");
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const third = limiter.check("ip-1");
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSeconds).toBeGreaterThanOrEqual(9);

    clock += 10_001;
    const afterWindow = limiter.check("ip-1");
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(1);
  });

  it("evicts the oldest key when maxKeys is reached", () => {
    const clock = 1_000;
    const limiter = createMemoryRateLimiter({
      limit: 1,
      windowMs: 60_000,
      maxKeys: 2,
      now: () => clock,
    });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    // "b" is now oldest because checking "a" refreshed "a"
    expect(limiter.check("c").allowed).toBe(true);
    // "b" was evicted so it has a fresh bucket again
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("extracts client IP safely from XFF right-to-left and ignores spoofed platform headers on self-host", async () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "198.51.100.42" }))).toBe("198.51.100.42");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.10" }))).toBe(
      "203.0.113.10",
    );
    expect(
      clientIpFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.10, 10.0.0.1" }), 2),
    ).toBe("203.0.113.10");

    // On self-host (VERCEL_ENV unset), spoofed platform headers do not override XFF.
    expect(
      clientIpFrom(
        new Headers({
          "cf-connecting-ip": "203.0.113.9",
          "x-vercel-forwarded-for": "203.0.113.8",
          "x-forwarded-for": "198.51.100.1",
        }),
      ),
    ).toBe("198.51.100.1");

    // Explicit platform opt-in trusts that platform's single-hop header.
    expect(
      clientIpFrom(
        new Headers({
          "cf-connecting-ip": "203.0.113.9",
          "x-forwarded-for": "198.51.100.1",
        }),
        { trustPlatform: "cloudflare" },
      ),
    ).toBe("203.0.113.9");
    expect(
      clientIpFrom(
        new Headers({
          "x-vercel-forwarded-for": "1.2.3.4, 203.0.113.8",
          "x-forwarded-for": "198.51.100.1",
        }),
        { trustPlatform: "vercel" },
      ),
    ).toBe("203.0.113.8");
    expect(
      clientIpFrom(
        new Headers({
          "x-real-ip": "198.51.100.7",
          "x-forwarded-for": "198.51.100.1",
        }),
        { trustPlatform: "vercel" },
      ),
    ).toBe("198.51.100.7");

    // Auto mode enables Vercel headers when VERCEL_ENV is set.
    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TRUST_IDENTITY_HEADER", "false");
    const { clientIpFrom: vercelClientIpFrom } = await import("./rate-limit");
    expect(
      vercelClientIpFrom(
        new Headers({
          "x-vercel-forwarded-for": "203.0.113.77",
          "x-forwarded-for": "198.51.100.1",
        }),
      ),
    ).toBe("203.0.113.77");

    // Fallback to x-real-ip only when XFF is absent.
    expect(clientIpFrom(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });

  it("builds a 429 response with Retry-After and requestId", async () => {
    const response = rateLimitResponse(
      { allowed: false, remaining: 0, resetAtMs: 5_000, retryAfterSeconds: 4 },
      "req-123",
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("4");
    expect(response.headers.get("x-request-id")).toBe("req-123");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests",
      requestId: "req-123",
    });
  });
});
