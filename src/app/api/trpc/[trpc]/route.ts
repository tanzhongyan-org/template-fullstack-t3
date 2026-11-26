import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { after, type NextRequest } from "next/server";
import { limitBody, MAX_BODY_BYTES } from "~/server/api/body-limit";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { reportServerError } from "~/server/error-reporter";
import { logError, requestIdFrom } from "~/server/log";
import { env } from "~/shared/config/env";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling an HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = async (incoming: NextRequest) => {
  const requestId = requestIdFrom(incoming.headers);
  const req = await limitBody(incoming);
  if (!req) {
    return Response.json(
      { error: `Request body exceeds ${MAX_BODY_BYTES} bytes`, requestId },
      { status: 413, headers: { "x-request-id": requestId } },
    );
  }
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(incoming),
    responseMeta({ ctx }) {
      return {
        headers: {
          "x-request-id": ctx?.requestId ?? requestId,
        },
      };
    },
    onError({ path, error, ctx }) {
      const id = ctx?.requestId ?? requestId;
      if (env.NODE_ENV !== "test" || error.code === "INTERNAL_SERVER_ERROR") {
        logError({
          requestId: id,
          event: "trpc.error",
          path: path ?? "<no-path>",
          code: error.code,
          error: error.message,
        });
      }
      if (error.code === "INTERNAL_SERVER_ERROR") {
        const report = () => reportServerError(error, { requestId: id, path: path ?? undefined });
        try {
          after(report);
        } catch {
          void report();
        }
      }
    },
  });
};

export { handler as GET, handler as POST };
