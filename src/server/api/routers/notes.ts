import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { notes } from "~/server/db/schema";

export const notesRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [note] = await ctx.db
        .insert(notes)
        .values({
          ownerId: ctx.ownerId,
          title: input.title,
          body: input.body,
        })
        .returning();
      if (!note) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create note",
        });
      }
      return note;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notes.findMany({
      where: eq(notes.ownerId, ctx.ownerId),
      orderBy: [desc(notes.createdAt)],
    });
  }),

  get: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.db.query.notes.findFirst({
        where: and(eq(notes.id, input.id), eq(notes.ownerId, ctx.ownerId)),
      });
      if (!note) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
      }
      return note;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        body: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const values: { title?: string; body?: string } = {};
      if (input.title !== undefined) values.title = input.title;
      if (input.body !== undefined) values.body = input.body;

      const [updated] = await ctx.db
        .update(notes)
        .set(values)
        .where(and(eq(notes.id, input.id), eq(notes.ownerId, ctx.ownerId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
      }
      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(notes)
        .where(and(eq(notes.id, input.id), eq(notes.ownerId, ctx.ownerId)))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
      }
      return { success: true };
    }),
});
