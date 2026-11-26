export interface DbOptionsInput {
  url: string;
  prepareStatements?: boolean;
  maxConnections?: number;
  nodeEnv: "development" | "test" | "production";
  platform?: NodeJS.Platform;
}

export interface ResolvedDbOptions {
  prepare: boolean;
  max: number;
  connect_timeout: number;
  idle_timeout: number;
  host?: string;
}

/**
 * Resolve `postgres()` client options safely for both local Postgres and
 * serverless transaction poolers (e.g. Supabase port 6543 / PgBouncer).
 */
export function resolveDbOptions(input: DbOptionsInput): ResolvedDbOptions {
  const platform = input.platform ?? process.platform;
  let isPooler = false;
  let winLocalhost = false;
  try {
    const parsed = new URL(input.url);
    isPooler =
      parsed.port === "6543" ||
      parsed.searchParams.get("pgbouncer") === "true" ||
      parsed.hostname.endsWith(".pooler.supabase.com");
    winLocalhost = platform === "win32" && parsed.hostname === "localhost";
  } catch {
    isPooler = false;
  }

  return {
    prepare: input.prepareStatements ?? !isPooler,
    max: input.maxConnections ?? (input.nodeEnv === "production" ? 10 : 5),
    connect_timeout: 10,
    idle_timeout: 20,
    ...(winLocalhost ? { host: "127.0.0.1" } : {}),
  };
}
