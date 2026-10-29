import { exampleRouter } from "~/features/_example/server/router";
import { feedbackRouter } from "~/features/feedback/server/router";
import { notesRouter } from "~/features/notes/server/router";
import { waitlistRouter } from "~/features/waitlist/server/router";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * Each feature router in src/features/<x>/server/router.ts is added here.
 * `make new-feature` registers new routers in this map.
 */
export const appRouter = createTRPCRouter({
  notes: notesRouter,
  waitlist: waitlistRouter,
  feedback: feedbackRouter,
  example: exampleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
