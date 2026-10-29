import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "~/server/db";
import { budget, usageEvent } from "~/server/db/schema";
import { __setEmailTransportForTests } from "~/server/email";
import { GET } from "./route";

const authed = () =>
  new Request("http://localhost/api/cron/budget-check", {
    headers: { authorization: "Bearer test-cron-secret" },
  });

describe("budget cron", () => {
  afterEach(() => {
    __setEmailTransportForTests(null);
  });

  it("rejects a missing secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/budget-check"));
    expect(response.status).toBe(401);
  });

  it("emails once at 80% and once at 100%", async () => {
    const provider = `prov-${Date.now()}`;
    const period = new Date().toISOString().slice(0, 7);
    await db.insert(budget).values({
      provider,
      monthlyLimitMinor: 1000,
      currency: "USD",
      period,
      alert80Sent: false,
      alert100Sent: false,
    });
    await db.insert(usageEvent).values({
      feature: "cron-test",
      provider,
      units: 1,
      costMinor: 850,
      currency: "USD",
    });

    const subjects: string[] = [];
    __setEmailTransportForTests(async (message) => {
      subjects.push(message.subject);
      return { delivered: true, id: "test" };
    });

    const first = await GET(authed());
    expect(first.status).toBe(200);
    expect(subjects).toHaveLength(1);
    expect(subjects[0]).toContain("80%");

    const second = await GET(authed());
    expect(second.status).toBe(200);
    expect(subjects).toHaveLength(1);

    await db.insert(usageEvent).values({
      feature: "cron-test",
      provider,
      units: 1,
      costMinor: 200,
      currency: "USD",
    });
    const third = await GET(authed());
    expect(subjects).toHaveLength(2);
    expect(subjects[1]).toContain("100%");
    const body = (await third.json()) as { notified: Array<{ provider: string; level: number }> };
    expect(body.notified).toEqual([{ provider, level: 100 }]);

    await db.delete(usageEvent).where(eq(usageEvent.provider, provider));
    await db.delete(budget).where(eq(budget.provider, provider));
  });
});
