import { analyticsPayloadSchema } from "@repo/shared/analytics";
import { trackServer } from "~/server/analytics";
import { parseJsonBody } from "~/server/api/parse";
import { logRequest, requestIdFrom } from "~/server/log";

/**
 * Client event intake. Validates against the taxonomy and forwards server-side
 * so the PostHog key never reaches the browser.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  const parsed = await parseJsonBody(request, analyticsPayloadSchema);
  if (parsed instanceof Response) return parsed;
  const { tracked } = await trackServer(parsed);
  logRequest({ requestId, event: "analytics", status: 200 });
  return Response.json({ tracked }, { headers: { "x-request-id": requestId } });
}
