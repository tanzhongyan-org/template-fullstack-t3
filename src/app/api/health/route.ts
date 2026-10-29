import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { logError, logRequest, requestIdFrom } from "~/server/log";

/** Liveness probe for Better Stack and the DAST health check. Pings the database. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    logRequest({ requestId, event: "health", durationMs: Date.now() - started, status: 200 });
    return Response.json({ ok: true }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    logError({
      requestId,
      event: "health",
      durationMs: Date.now() - started,
      status: 503,
      error: error instanceof Error ? error.message : "health check failed",
    });
    return Response.json(
      { ok: false, requestId },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
