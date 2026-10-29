import type { z } from "zod";
import { limitBody } from "./body-limit";

/**
 * Read and validate a route-handler body. Returns the parsed data, or a 400 /
 * 413 Response the handler returns as-is. Route handlers must use this (or
 * readRawBody for HMAC webhooks) instead of req.json() / req.text().
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T | Response> {
  const limited = await limitBody(request);
  if (!limited) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }
  const parsed = schema.safeParse(await limited.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  return parsed.data;
}

/** Read the raw text body for HMAC-verified webhooks. Returns a 413 Response when too large. */
export async function readRawBody(request: Request): Promise<string | Response> {
  const limited = await limitBody(request);
  if (!limited) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }
  return limited.text();
}
