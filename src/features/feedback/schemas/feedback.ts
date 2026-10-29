import { z } from "zod";

const feedbackKinds = ["bug", "idea", "praise", "nps"] as const;

export const submitFeedbackSchema = z.object({
  kind: z.enum(feedbackKinds),
  score: z.number().int().min(0).max(10).optional(),
  body: z.string().min(1).max(2000),
  page: z.string().max(512),
});
