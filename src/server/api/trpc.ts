import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { clientIpFrom, createMemoryRateLimiter } from "~/server/api/rate-limit";
import { getServerSession, isAdmin } from "~/server/auth";
import { db } from "~/server/db";
import { logRequest, requestIdFrom } from "~/server/log";
import { env } from "~/shared/config/env";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerSession(opts.headers);
  return {
    db,
    session,
    ownerId: session?.id ?? null,
    requestId: requestIdFrom(opts.headers),
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    const leaksInternals = error.code === "INTERNAL_SERVER_ERROR" && env.NODE_ENV === "production";
    return {
      ...shape,
      message: leaksInternals ? "Internal server error" : shape.message,
      data: {
        ...shape.data,
        requestId: ctx?.requestId ?? null,
        zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

const timingMiddleware = t.middleware(async ({ ctx, path, type, next }) => {
  const started = Date.now();
  const result = await next();
  if (env.NODE_ENV !== "test") {
    logRequest({
      requestId: ctx.requestId,
      event: "trpc",
      path,
      type,
      durationMs: Date.now() - started,
      ok: result.ok,
    });
  }
  return result;
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/** @public Template API: use for procedures that need no identity. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Rejects callers without an identity and narrows `ctx.session` and `ctx.ownerId`. */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { session: ctx.session, ownerId: ctx.session.id } });
});

/** Rejects authenticated callers without the `admin` role. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.session)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/**
 * Middleware enforcing a sliding-window rate limit keyed by caller id or client IP.
 * Compose onto `publicProcedure` or `protectedProcedure`: `.use(rateLimit(...))`.
 */
export function rateLimit(opts: { limit: number; windowMs: number; keyPrefix?: string }) {
  const limiter = createMemoryRateLimiter({ limit: opts.limit, windowMs: opts.windowMs });
  return t.middleware(({ ctx, path, next }) => {
    const identity = ctx.ownerId ?? clientIpFrom(ctx.headers);
    const result = limiter.check(`${opts.keyPrefix ?? path}:${identity}`);
    if (!result.allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests" });
    }
    return next();
  });
}
