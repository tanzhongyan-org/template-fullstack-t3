import { devShortcutsEnabled } from "~/shared/config/dev-guard";
import { env } from "~/shared/config/env";

/**
 * Cron guard: Vercel Cron sends CRON_SECRET as a bearer token. Without a
 * secret the route runs in local development only.
 */
export function cronAuthorized(request: Request): boolean {
  if (!env.CRON_SECRET) return devShortcutsEnabled();
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
