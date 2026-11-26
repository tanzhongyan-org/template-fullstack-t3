import { env } from "~/shared/config/env";

export type UserRole = "user" | "admin";

export interface SessionUser {
  id: string;
  role: UserRole;
}

const parseAdminIds = (raw: string | undefined): Set<string> =>
  new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

/**
 * Resolve the caller session from request headers.
 *
 * TEMPLATE-TODO(auth): replace header identity in src/server/auth/index.ts with
 * real session auth (see docs/recipes/auth-providers.md).
 */
export async function getServerSession(headers: Headers): Promise<SessionUser | null> {
  if (!env.TRUST_IDENTITY_HEADER) return null;
  const id = headers.get("x-user-id")?.trim();
  if (!id) return null;

  const roleHeader = headers.get("x-user-role")?.trim();
  const adminIds = parseAdminIds(env.ADMIN_USER_IDS);
  const role: UserRole = roleHeader === "admin" || adminIds.has(id) ? "admin" : "user";

  return { id, role };
}

/** @public Check whether a resolved session carries admin privileges. */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}
