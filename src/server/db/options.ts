export interface DbOptionsInput {
  url: string;
  prepareStatements?: boolean | string;
  maxConnections?: number;
  nodeEnv: "development" | "test" | "production";
  platform?: NodeJS.Platform;
}

const resolvePrepareFlag = (value: boolean | string | undefined, fallback: boolean): boolean => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
};

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
    prepare: resolvePrepareFlag(input.prepareStatements, !isPooler),
    max: input.maxConnections ?? (input.nodeEnv === "production" ? 10 : 5),
    connect_timeout: 10,
    idle_timeout: 20,
    ...(winLocalhost ? { host: "127.0.0.1" } : {}),
  };
}

/**
 * Strip proxy-only query flags such as `pgbouncer` before passing the DSN to
 * `postgres()`, since postgres.js forwards unknown query keys as startup parameters.
 */
export function sanitizeDbUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("pgbouncer")) return url;
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return url;
  }
}
