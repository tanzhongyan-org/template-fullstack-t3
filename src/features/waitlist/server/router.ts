import { TRPCError } from "@trpc/server";
import { count, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { waitlist } from "~/server/db/schema";
import { env } from "~/shared/config/env";
import { joinWaitlistSchema } from "../schemas/waitlist";

interface TurnstileOptions {
  secret: string | undefined;
  nodeEnv: string;
}

/**
 * Verify a Turnstile token with Cloudflare. Without a secret the check passes
 * outside production (local runs and tests) and fails closed in production.
 */
export async function verifyTurnstile(
  token: string | undefined,
  options: TurnstileOptions = { secret: env.TURNSTILE_SECRET_KEY, nodeEnv: env.NODE_ENV },
): Promise<boolean> {
  if (!options.secret) return options.nodeEnv !== "production";
  if (!token) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: options.secret, response: token }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return false;
  const body = (await response.json()) as { success?: boolean };
  return body.success === true;
}

export const waitlistRouter = createTRPCRouter({
  join: publicProcedure.input(joinWaitlistSchema).mutation(async ({ ctx, input }) => {
    const human = await verifyTurnstile(input.turnstileToken);
    if (!human) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Captcha verification failed" });
    }
    await ctx.db
      .insert(waitlist)
      .values({ email: input.email.toLowerCase() })
      .onConflictDoNothing({ target: waitlist.email });
    const [row] = await ctx.db.select({ value: count() }).from(waitlist);
    return { success: true as const, position: row?.value ?? 1 };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.waitlist.findMany({ orderBy: [desc(waitlist.createdAt)], limit: 100 });
  }),
});
