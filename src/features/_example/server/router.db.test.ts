import { afterEach, describe, expect, it } from "vitest";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { __setEmailTransportForTests } from "~/server/email";

describe("example router", () => {
  afterEach(() => {
    __setEmailTransportForTests(null);
  });

  const callerFor = (userId: string) =>
    appRouter.createCaller({
      db,
      session: { id: userId, role: "user" },
      ownerId: userId,
      requestId: "test-example-req",
      headers: new Headers(),
    });

  it("create notifies the owner and enforces tenant isolation", async () => {
    const sent: string[] = [];
    __setEmailTransportForTests(async (message) => {
      sent.push(message.subject);
      return { delivered: true, id: "test" };
    });
    const alice = callerFor("example-alice");
    const created = await alice.example.create({ title: "Sliced", body: "thin" });
    expect(created.title).toBe("Sliced");
    expect(sent).toHaveLength(1);

    const bob = callerFor("example-bob");
    await expect(bob.example.get({ id: created.id })).rejects.toThrow();
    await expect(bob.example.delete({ id: created.id })).rejects.toThrow();
    expect((await alice.example.delete({ id: created.id })).success).toBe(true);
  });
});
