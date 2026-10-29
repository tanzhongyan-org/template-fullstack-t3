import { z } from "zod";

export const joinWaitlistSchema = z.object({
  email: z.string().email().max(320),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
