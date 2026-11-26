# Authentication Providers

## Vercel Auth vs Customer Auth

- **Vercel Authentication (Deployment Protection)** locks staging/preview deployments so only your team can open preview URLs. It is **not** customer sign-in.
- **Customer Authentication** (email/password, magic links, Google/Apple OAuth, anonymous sessions) is handled inside the app behind [`src/server/auth/index.ts`](../../src/server/auth/index.ts).

Because every tRPC procedure reads `ctx.session` (`{ id, role }`) from `getServerSession(headers)`, swapping auth providers only touches `src/server/auth/index.ts` plus your login route/UI.

## Option A: Better Auth (Self-Hosted in Your Postgres)

Better Auth stores users, sessions, OAuth accounts, and organizations directly in your Drizzle Postgres schema with zero third-party auth fees.

1. Install: `bun add better-auth` (record it in `docs/dependencies.md`).
2. Add Better Auth tables to `src/server/db/schema.ts` and run `make db-generate`.
3. Mount the catch-all handler at `src/app/api/auth/<...all>/route.ts`.
4. Update `getServerSession` in `src/server/auth/index.ts`:

```ts
import { auth } from "./better-auth";
import type { SessionUser } from "./types";

export async function getServerSession(headers: Headers): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  const role = session.user.role === "admin" ? "admin" : "user";
  return { id: session.user.id, role };
}
```

## Option B: Supabase Auth

If your database is on Supabase and you want hosted email/password, magic links, OAuth, or anonymous sessions:

1. Install: `bun add @supabase/ssr @supabase/supabase-js` (record both in `docs/dependencies.md`).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `src/shared/config/env.js`, `.env.example`, and `README.md`.
3. Create a Supabase server client reading request cookies and resolve the user inside `src/server/auth/index.ts`:

   ```ts
   import { createServerClient } from "@supabase/ssr";
   import { cookies } from "next/headers";
   import { env } from "~/shared/config/env";
   import type { SessionUser } from "./index";

   export async function getServerSession(_headers: Headers): Promise<SessionUser | null> {
     const cookieStore = await cookies();
     const supabase = createServerClient(
       env.NEXT_PUBLIC_SUPABASE_URL,
       env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
       {
         cookies: {
           getAll: () => cookieStore.getAll(),
         },
       },
     );
     const { data } = await supabase.auth.getUser();
     if (!data.user) return null;
     const role = data.user.app_metadata?.role === "admin" ? "admin" : "user";
     return { id: data.user.id, role };
   }
   ```

4. Once real auth is active, delete `TRUST_IDENTITY_HEADER` from `src/shared/config/env.js` and `.env.example`.
