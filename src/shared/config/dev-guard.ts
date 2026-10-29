import { env } from "./env";

export interface DevEnvironment {
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}

const readEnvironment = (): DevEnvironment => ({
  nodeEnv: env.NODE_ENV,
  vercelEnv: env.VERCEL_ENV,
});

/**
 * True only for local development: NODE_ENV=development and VERCEL_ENV neither
 * production nor preview. Every dev shortcut (console email/OTP, seeding,
 * unsigned webhooks) must check this; tests prove each one is off otherwise.
 */
export function devShortcutsEnabled(environment: DevEnvironment = readEnvironment()): boolean {
  return (
    environment.nodeEnv === "development" &&
    environment.vercelEnv !== "production" &&
    environment.vercelEnv !== "preview"
  );
}

/** Throw when a dev-only entry point runs outside local development. */
export function assertLocalDev(environment: DevEnvironment = readEnvironment()): void {
  if (!devShortcutsEnabled(environment)) {
    throw new Error("This entry point runs in local development only.");
  }
}
