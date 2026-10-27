import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Identity stub: reads x-user-id header with a test fallback.
  // Single swap point for real authentication / session tokens.
  const ownerId = opts.headers.get("x-user-id") ?? "test-owner";
  return {
    db,
    ownerId,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
