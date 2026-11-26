import type { Config } from "drizzle-kit";

import { env } from "~/shared/config/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
  },
} satisfies Config;
