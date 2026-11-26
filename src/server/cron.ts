import { timingSafeEqual } from "node:crypto";
import { devShortcutsEnabled } from "~/shared/config/dev-guard";
import { env } from "~/shared/config/env";

/**
 * Cron guard: Vercel Cron sends CRON_SECRET as a bearer token. Compares in
 * constant time; without a secret the route runs in local development only.
 * @public
 */
export function cronAuthorized(request: Request): boolean {
  if (!env.CRON_SECRET) return devShortcutsEnabled();
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** @public Standard 401 response for unauthorized cron requests. */
export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
