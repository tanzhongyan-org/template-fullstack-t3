import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("health route", () => {
  it("answers ok with a request id", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const body = (await response.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
