import { describe, expect, it } from "vitest";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("feedback router", () => {
  const callerFor = (id: string, role: "user" | "admin" = "user") =>
    appRouter.createCaller({
      db,
      session: { id, role },
      ownerId: id,
      requestId: "test-feedback-req",
      headers: new Headers({ "x-user-id": id }),
    });

  it("submit stores feedback and listMine isolates by owner", async () => {
    const alice = callerFor("feedback-alice");
    const bob = callerFor("feedback-bob");
    const aliceBody = `alice feedback ${Date.now()}`;
    const bobBody = `bob feedback ${Date.now()}`;

    const created = await alice.feedback.submit({
      kind: "idea",
      body: aliceBody,
      page: "/examples",
    });
    expect(created.success).toBe(true);
    await bob.feedback.submit({ kind: "bug", body: bobBody, page: "/examples" });

    const aliceRows = await alice.feedback.listMine();
    expect(aliceRows.some((row) => row.body === aliceBody)).toBe(true);
    expect(aliceRows.some((row) => row.ownerId !== "feedback-alice")).toBe(false);
    expect(aliceRows.some((row) => row.body === bobBody)).toBe(false);
  });

  it("restricts listAll to admin callers", async () => {
    const member = callerFor("feedback-member", "user");
    await expect(member.feedback.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const admin = callerFor("feedback-admin", "admin");
    const allRows = await admin.feedback.listAll();
    expect(Array.isArray(allRows)).toBe(true);
  });

  it("rejects an empty body and an out-of-range score", async () => {
    const caller = callerFor("feedback-owner");
    await expect(caller.feedback.submit({ kind: "bug", body: "", page: "/" })).rejects.toThrow();
    await expect(
      caller.feedback.submit({ kind: "nps", score: 11, body: "x", page: "/" }),
    ).rejects.toThrow();
  });

  it("rate-limits excessive feedback submissions per caller", async () => {
    const caller = callerFor(`feedback-ratelimit-${Date.now()}`);
    for (let i = 0; i < 10; i++) {
      await caller.feedback.submit({ kind: "idea", body: `item ${i}`, page: "/" });
    }
    await expect(
      caller.feedback.submit({ kind: "idea", body: "over limit", page: "/" }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
