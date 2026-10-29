import { createHmac } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "~/server/db";
import { webhookEvents } from "~/server/db/schema";
import { POST } from "./route";

const sign = (body: string, secret: string): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
};

const postEvent = (body: string, signature: string) =>
  POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body,
    }),
  );

describe("stripe webhook route", () => {
  it("rejects a bad signature", async () => {
    const response = await postEvent('{"id":"evt_bad"}', "t=1,v1=deadbeef");
    expect(response.status).toBe(400);
  });

  it("records the event and ignores the replay", async () => {
    const eventId = `evt_${Date.now()}`;
    const body = JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      data: { object: { id: "cs_test", customer: "cus_test" } },
    });
    const signature = sign(body, "whsec_test_secret");

    const first = await postEvent(body, signature);
    expect(first.status).toBe(200);
    const second = await postEvent(body, signature);
    expect(second.status).toBe(200);

    const rows = await db
      .select({ value: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId));
    expect(rows[0]?.value).toBe(1);
  });
});
