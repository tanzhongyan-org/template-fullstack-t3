import { afterEach, describe, expect, it } from "vitest";
import { __setEmailTransportForTests } from "~/server/email";
import { GET } from "./route";

describe("digest cron", () => {
  afterEach(() => {
    __setEmailTransportForTests(null);
  });

  it("rejects a missing secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/digest"));
    expect(response.status).toBe(401);
  });

  it("sends one digest with the weekly counts", async () => {
    const subjects: string[] = [];
    __setEmailTransportForTests(async (message) => {
      subjects.push(message.subject);
      return { delivered: true, id: "test" };
    });
    const response = await GET(
      new Request("http://localhost/api/cron/digest", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(subjects).toHaveLength(1);
    const body = (await response.json()) as { waitlistJoins: number; feedback: number };
    expect(typeof body.waitlistJoins).toBe("number");
    expect(typeof body.feedback).toBe("number");
  });
});
