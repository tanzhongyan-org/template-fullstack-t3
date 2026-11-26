import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/shared/config/env";
import { resolveDbOptions, sanitizeDbUrl } from "./options";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(
    sanitizeDbUrl(env.DATABASE_URL),
    resolveDbOptions({
      url: env.DATABASE_URL,
      prepareStatements: env.DB_PREPARE_STATEMENTS,
      maxConnections: env.DB_MAX_CONNECTIONS,
      nodeEnv: env.NODE_ENV,
    }),
  );
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
