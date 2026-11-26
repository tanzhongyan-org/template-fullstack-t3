import { afterEach, describe, expect, it, vi } from "vitest";

describe("auth session boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const loadAuth = async (overrides: Record<string, string>) => {
    vi.resetModules();
    for (const [key, value] of Object.entries(overrides)) {
      vi.stubEnv(key, value);
    }
    return import("./index");
  };

  it("returns null when TRUST_IDENTITY_HEADER is false", async () => {
    const { getServerSession } = await loadAuth({ TRUST_IDENTITY_HEADER: "false" });
    await expect(getServerSession(new Headers({ "x-user-id": "alice" }))).resolves.toBeNull();
  });

  it("returns null when x-user-id is missing or blank", async () => {
    const { getServerSession } = await loadAuth({ TRUST_IDENTITY_HEADER: "true" });
    await expect(getServerSession(new Headers())).resolves.toBeNull();
    await expect(getServerSession(new Headers({ "x-user-id": "   " }))).resolves.toBeNull();
  });

  it("resolves a standard user session when header is present", async () => {
    const { getServerSession, isAdmin } = await loadAuth({ TRUST_IDENTITY_HEADER: "true" });
    const session = await getServerSession(new Headers({ "x-user-id": "alice" }));
    expect(session).toEqual({ id: "alice", role: "user" });
    expect(isAdmin(session)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("grants admin role via x-user-role header or ADMIN_USER_IDS allowlist", async () => {
    const { getServerSession, isAdmin } = await loadAuth({
      TRUST_IDENTITY_HEADER: "true",
      ADMIN_USER_IDS: "root-user, ops-admin ",
    });

    const headerAdmin = await getServerSession(
      new Headers({ "x-user-id": "alice", "x-user-role": "admin" }),
    );
    expect(headerAdmin).toEqual({ id: "alice", role: "admin" });
    expect(isAdmin(headerAdmin)).toBe(true);

    const allowlistedAdmin = await getServerSession(new Headers({ "x-user-id": "ops-admin" }));
    expect(allowlistedAdmin).toEqual({ id: "ops-admin", role: "admin" });
    expect(isAdmin(allowlistedAdmin)).toBe(true);
  });

  it("fails closed at boot if TRUST_IDENTITY_HEADER=true in NODE_ENV=production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUST_IDENTITY_HEADER", "true");
    await expect(import("~/shared/config/env")).rejects.toThrow(
      /TRUST_IDENTITY_HEADER must be false/,
    );
  });

  it("fails closed at boot if TRUST_IDENTITY_HEADER=true in VERCEL_ENV=preview", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("TRUST_IDENTITY_HEADER", "true");
    await expect(import("~/shared/config/env")).rejects.toThrow(
      /TRUST_IDENTITY_HEADER must be false/,
    );
  });
});
