import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

async function defaultCaller(headers: Record<string, string>) {
  const ctx = await createTRPCContext({ headers: new Headers(headers) });
  return appRouter.createCaller(ctx);
}

async function callerWithEnv(
  envOverrides: Record<string, string>,
  headers: Record<string, string>,
) {
  vi.resetModules();
  for (const [key, value] of Object.entries(envOverrides)) {
    vi.stubEnv(key, value);
  }
  const modRoot = await import("~/server/api/root");
  const modTrpc = await import("~/server/api/trpc");
  const ctx = await modTrpc.createTRPCContext({ headers: new Headers(headers) });
  return modRoot.appRouter.createCaller(ctx);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("identity and RBAC are fail-closed", () => {
  it("rejects a missing x-user-id header with UNAUTHORIZED", async () => {
    const caller = await defaultCaller({});
    await expect(caller.example.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a blank x-user-id header with UNAUTHORIZED", async () => {
    const caller = await defaultCaller({ "x-user-id": "   " });
    await expect(caller.example.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("ignores the header when TRUST_IDENTITY_HEADER is false", async () => {
    const caller = await callerWithEnv(
      { TRUST_IDENTITY_HEADER: "false" },
      { "x-user-id": "alice" },
    );
    await expect(caller.example.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }, 15_000);

  it("accepts the header when TRUST_IDENTITY_HEADER is true", async () => {
    const caller = await defaultCaller({ "x-user-id": "trpc-identity-test" });
    await expect(caller.example.list()).resolves.toEqual([]);
  });

  it("rejects non-admin users on adminProcedure and permits header admins", async () => {
    const member = await defaultCaller({ "x-user-id": "member-1" });
    await expect(member.feedback.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const headerAdmin = await defaultCaller({
      "x-user-id": "admin-1",
      "x-user-role": "admin",
    });
    await expect(headerAdmin.feedback.listAll()).resolves.toBeInstanceOf(Array);
  });

  it("permits admins listed in ADMIN_USER_IDS", async () => {
    const allowlistAdmin = await callerWithEnv(
      { TRUST_IDENTITY_HEADER: "true", ADMIN_USER_IDS: "ops-user" },
      { "x-user-id": "ops-user" },
    );
    await expect(allowlistAdmin.feedback.listAll()).resolves.toBeInstanceOf(Array);
  }, 15_000);

  it("propagates requestId into createTRPCContext", async () => {
    const ctx = await createTRPCContext({
      headers: new Headers({ "x-request-id": "req-trace-42" }),
    });
    expect(ctx.requestId).toBe("req-trace-42");
    expect(new TRPCError({ code: "BAD_REQUEST" }).code).toBe("BAD_REQUEST");
  });
});
