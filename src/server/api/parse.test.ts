import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJsonBody, readRawBody } from "./parse";

const schema = z.object({ name: z.string().min(1) });

describe("parseJsonBody & readRawBody", () => {
  it("parses valid JSON matching the schema", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "ok" }),
    });
    await expect(parseJsonBody(req, schema)).resolves.toEqual({ name: "ok" });
  });

  it("returns 400 instead of throwing on malformed JSON", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: "{not-json",
    });
    const result = await parseJsonBody(req, schema);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
      await expect(result.json()).resolves.toEqual({ error: "Invalid JSON" });
    }
  });

  it("returns 400 when schema validation fails", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const result = await parseJsonBody(req, schema);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
      await expect(result.json()).resolves.toEqual({ error: "Invalid request body" });
    }
  });

  it("returns 413 when body exceeds 1 MB", async () => {
    const big = "x".repeat(1_000_001);
    const jsonRes = await parseJsonBody(
      new Request("http://localhost/api/test", { method: "POST", body: big }),
      schema,
    );
    expect(jsonRes).toBeInstanceOf(Response);
    if (jsonRes instanceof Response) expect(jsonRes.status).toBe(413);

    const rawRes = await readRawBody(
      new Request("http://localhost/api/test", { method: "POST", body: big }),
    );
    expect(rawRes).toBeInstanceOf(Response);
    if (rawRes instanceof Response) expect(rawRes.status).toBe(413);
  });
});
