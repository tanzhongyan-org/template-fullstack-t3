import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSentryDsn } from "./error-reporter";

describe("error reporter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses valid Sentry DSNs and rejects invalid ones", () => {
    expect(parseSentryDsn("https://abc123@o100.ingest.sentry.io/456789")).toEqual({
      envelopeUrl: "https://o100.ingest.sentry.io/api/456789/envelope/",
      publicKey: "abc123",
      dsn: "https://abc123@o100.ingest.sentry.io/456789",
    });
    expect(parseSentryDsn("https://abc123@sentry.example.com/sub/42")).toEqual({
      envelopeUrl: "https://sentry.example.com/sub/api/42/envelope/",
      publicKey: "abc123",
      dsn: "https://abc123@sentry.example.com/sub/42",
    });
    expect(parseSentryDsn("not-a-dsn")).toBeNull();
    expect(parseSentryDsn("https://no-key.sentry.io/123")).toBeNull();
    expect(parseSentryDsn("https://key@sentry.io/not-numeric")).toBeNull();
  });

  it("stays dormant when SENTRY_DSN is unset", async () => {
    vi.resetModules();
    vi.stubEnv("SENTRY_DSN", "");
    const { reportServerError } = await import("./error-reporter");
    await expect(reportServerError(new Error("boom"), { requestId: "req-1" })).resolves.toEqual({
      reported: false,
    });
  });

  it("sends a Sentry envelope when SENTRY_DSN is configured", async () => {
    vi.resetModules();
    vi.stubEnv("SENTRY_DSN", "https://pub123@o1.ingest.sentry.io/99");
    const { __setErrorReporterTransportForTests, reportServerError } = await import(
      "./error-reporter"
    );

    const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
    __setErrorReporterTransportForTests(async (req) => {
      calls.push(req);
    });

    const res = await reportServerError(new Error("boom"), {
      requestId: "req-99",
      path: "/api/trpc/example.list",
      method: "GET",
      digest: "dig-1",
    });
    __setErrorReporterTransportForTests(null);

    expect(res).toEqual({ reported: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://o1.ingest.sentry.io/api/99/envelope/");
    expect(calls[0]?.headers["X-Sentry-Auth"]).toContain("sentry_key=pub123");
    expect(calls[0]?.body).toContain('"requestId":"req-99"');
    expect(calls[0]?.body).toContain('"digest":"dig-1"');
  });

  it("swallows transport failures cleanly", async () => {
    vi.resetModules();
    vi.stubEnv("SENTRY_DSN", "https://pub123@o1.ingest.sentry.io/99");
    const { __setErrorReporterTransportForTests, reportServerError } = await import(
      "./error-reporter"
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    __setErrorReporterTransportForTests(async () => {
      throw new Error("network down");
    });

    const res = await reportServerError(new Error("boom"), { requestId: "req-fail" });
    __setErrorReporterTransportForTests(null);
    errorSpy.mockRestore();

    expect(res).toEqual({ reported: false });
  });
});
