import { describe, expect, it } from "vitest";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { verifyTurnstile } from "./router";

describe("waitlist router", () => {
  const caller = appRouter.createCaller({ db, ownerId: null, headers: new Headers() });

  it("skips captcha without a secret outside production, fails closed in production", async () => {
    await expect(verifyTurnstile(undefined, { secret: undefined, nodeEnv: "test" })).resolves.toBe(
      true,
    );
    await expect(
      verifyTurnstile(undefined, { secret: undefined, nodeEnv: "production" }),
    ).resolves.toBe(false);
    await expect(verifyTurnstile(undefined, { secret: "set", nodeEnv: "test" })).resolves.toBe(
      false,
    );
  });

  it("join is idempotent per email and reports a position", async () => {
    const email = `waitlist-${Date.now()}@example.com`;
    const first = await caller.waitlist.join({ email });
    expect(first.success).toBe(true);
    expect(first.position).toBeGreaterThanOrEqual(1);
    const second = await caller.waitlist.join({ email });
    expect(second.success).toBe(true);
    expect(second.position).toBe(first.position);
  });

  it("rejects an invalid email", async () => {
    await expect(caller.waitlist.join({ email: "not-an-email" })).rejects.toThrow();
  });
});
