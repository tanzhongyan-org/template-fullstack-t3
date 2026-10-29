import { afterEach, describe, expect, it } from "vitest";
import { __setEmailTransportForTests, sendEmail } from "./email";

describe("email sender", () => {
  afterEach(() => {
    __setEmailTransportForTests(null);
  });

  it("uses the injected transport in tests", async () => {
    __setEmailTransportForTests(async (message) => {
      expect(message.to).toBe("owner@example.com");
      return { delivered: true, id: "test-id" };
    });
    const result = await sendEmail({ to: "owner@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(result).toEqual({ delivered: true, id: "test-id" });
  });

  it("refuses console email outside local development", async () => {
    // NODE_ENV=test here, so the dev shortcut is off and no RESEND_API_KEY is set.
    await expect(sendEmail({ to: "a@b.c", subject: "x", html: "x" })).rejects.toThrow(
      /local development only/,
    );
  });
});
