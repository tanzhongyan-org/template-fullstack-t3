import { describe, expect, it } from "vitest";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("feedback router", () => {
  const caller = appRouter.createCaller({
    db,
    ownerId: "feedback-owner",
    headers: new Headers({ "x-user-id": "feedback-owner" }),
  });

  it("submit stores feedback and list returns it", async () => {
    const body = `feedback body ${Date.now()}`;
    const created = await caller.feedback.submit({ kind: "idea", body, page: "/examples" });
    expect(created.success).toBe(true);

    const rows = await caller.feedback.list();
    expect(rows.some((row) => row.body === body && row.ownerId === "feedback-owner")).toBe(true);
  });

  it("rejects an empty body and an out-of-range score", async () => {
    await expect(caller.feedback.submit({ kind: "bug", body: "", page: "/" })).rejects.toThrow();
    await expect(
      caller.feedback.submit({ kind: "nps", score: 11, body: "x", page: "/" }),
    ).rejects.toThrow();
  });
});
