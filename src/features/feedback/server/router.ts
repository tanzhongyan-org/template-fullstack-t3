import { desc, eq } from "drizzle-orm";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { feedback } from "~/server/db/schema";
import { submitFeedbackSchema } from "../schemas/feedback";

export const feedbackRouter = createTRPCRouter({
  submit: protectedProcedure.input(submitFeedbackSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .insert(feedback)
      .values({
        ownerId: ctx.ownerId,
        kind: input.kind,
        score: input.score ?? null,
        body: input.body,
        page: input.page,
      })
      .returning();
    return { success: true as const, id: row?.id ?? 0 };
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.feedback.findMany({
      where: eq(feedback.ownerId, ctx.ownerId),
      orderBy: [desc(feedback.createdAt)],
      limit: 100,
    });
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.feedback.findMany({
      orderBy: [desc(feedback.createdAt)],
      limit: 100,
    });
  }),
});
