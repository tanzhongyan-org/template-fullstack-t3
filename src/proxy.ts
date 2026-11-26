import { type NextRequest, NextResponse } from "next/server";

/**
 * Sets the request id every log line and error response carries. The matcher
 * skips static assets and images so they never become function invocations.
 */
export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image).*)"],
};
