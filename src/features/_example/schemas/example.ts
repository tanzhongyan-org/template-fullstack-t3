import { z } from "zod";

export const exampleIdSchema = z.object({ id: z.number().int().positive() });

export const createExampleSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().default(""),
});

export const updateExampleSchema = exampleIdSchema.extend({
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
});

export const askExampleSchema = z.object({
  prompt: z.string().min(1).max(2000),
});
