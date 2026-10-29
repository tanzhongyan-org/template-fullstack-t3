import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "../../app/api/trpc/[trpc]/route";
import { limitBody } from "./body-limit";

const post = (body: string) =>
  new Request("http://localhost/api/trpc/notes.create", { method: "POST", body });

describe("request body limit", () => {
  it("passes a body under the limit through intact", async () => {
    const limited = await limitBody(post("hello"), 10);
    expect(await limited?.text()).toBe("hello");
  });

  it("rejects a body over the limit", async () => {
    expect(await limitBody(post("x".repeat(11)), 10)).toBeNull();
  });

  it("answers 413 at the HTTP boundary", async () => {
    const res = await POST(post("x".repeat(1_000_001)) as never);
    expect(res.status).toBe(413);
  });

  it("rebuilds a NextRequest without losing the body", async () => {
    const incoming = new NextRequest("http://localhost/api/trpc/notes.create", {
      method: "POST",
      body: "hello",
    });
    const limited = await limitBody(incoming, 10);
    expect(await limited?.text()).toBe("hello");
  });
});
