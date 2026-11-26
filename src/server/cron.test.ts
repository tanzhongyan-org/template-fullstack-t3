import { afterEach, describe, expect, it, vi } from "vitest";

describe("cron authorization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const loadCron = async (overrides: Record<string, string>) => {
    vi.resetModules();
    for (const [key, value] of Object.entries(overrides)) {
      vi.stubEnv(key, value);
    }
    return import("./cron");
  };

  it("accepts the matching bearer token and rejects mismatches", async () => {
    const { cronAuthorized, unauthorized } = await loadCron({ CRON_SECRET: "super-secret" });

    expect(
      cronAuthorized(
        new Request("http://localhost/api/cron/x", {
          headers: { authorization: "Bearer super-secret" },
        }),
      ),
    ).toBe(true);

    expect(
      cronAuthorized(
        new Request("http://localhost/api/cron/x", {
          headers: { authorization: "Bearer wrong-secret" },
        }),
      ),
    ).toBe(false);

    expect(
      cronAuthorized(
        new Request("http://localhost/api/cron/x", {
          headers: { authorization: "Bearer short" },
        }),
      ),
    ).toBe(false);

    expect(cronAuthorized(new Request("http://localhost/api/cron/x"))).toBe(false);
    expect(unauthorized().status).toBe(401);
  });

  it("falls back to devShortcutsEnabled only when CRON_SECRET is unset", async () => {
    const inTest = await loadCron({ CRON_SECRET: "", NODE_ENV: "test" });
    expect(inTest.cronAuthorized(new Request("http://localhost/api/cron/x"))).toBe(false);

    const inDev = await loadCron({ CRON_SECRET: "", NODE_ENV: "development" });
    expect(inDev.cronAuthorized(new Request("http://localhost/api/cron/x"))).toBe(true);
  });
});
