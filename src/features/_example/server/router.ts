import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { contentValues } from "~/server/db/owned";
import { examples } from "~/server/db/schema";
import { sendEmail } from "~/server/email";
import { site } from "~/shared/config/site";
import { createExampleSchema, exampleIdSchema, updateExampleSchema } from "../schemas/example";
import { exampleCreatedEmail } from "./email";

const exampleNotFound = () => new TRPCError({ code: "NOT_FOUND", message: "Example not found" });

export const exampleRouter = createTRPCRouter({
  create: protectedProcedure.input(createExampleSchema).mutation(async ({ ctx, input }) => {
    const [example] = await ctx.db
      .insert(examples)
      .values({ ownerId: ctx.ownerId, title: input.title, body: input.body })
      .returning();
    if (!example) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create example" });
    }
    await sendEmail({ to: site.ownerEmail, ...exampleCreatedEmail(example.title, ctx.ownerId) });
    return example;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.examples.findMany({
      where: eq(examples.ownerId, ctx.ownerId),
      orderBy: [desc(examples.createdAt)],
    });
  }),

  get: protectedProcedure.input(exampleIdSchema).query(async ({ ctx, input }) => {
    const example = await ctx.db.query.examples.findFirst({
      where: and(eq(examples.id, input.id), eq(examples.ownerId, ctx.ownerId)),
    });
    if (!example) throw exampleNotFound();
    return example;
  }),

  update: protectedProcedure.input(updateExampleSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(examples)
      .set(contentValues(input))
      .where(and(eq(examples.id, input.id), eq(examples.ownerId, ctx.ownerId)))
      .returning();
    if (!updated) throw exampleNotFound();
    return updated;
  }),

  delete: protectedProcedure.input(exampleIdSchema).mutation(async ({ ctx, input }) => {
    const [deleted] = await ctx.db
      .delete(examples)
      .where(and(eq(examples.id, input.id), eq(examples.ownerId, ctx.ownerId)))
      .returning();
    if (!deleted) throw exampleNotFound();
    return { success: true };
  }),
});
