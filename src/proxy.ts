import { type NextRequest, NextResponse } from "next/server";

/**
 * Sets the request id every log line and error response carries. The matcher
 * skips static assets and images so they never become function invocations.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image).*)"],
};
