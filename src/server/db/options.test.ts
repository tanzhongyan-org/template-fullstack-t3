import { describe, expect, it } from "vitest";
import { resolveDbOptions } from "./options";

describe("database client options", () => {
  it("keeps prepared statements enabled for direct local Postgres", () => {
    expect(
      resolveDbOptions({
        url: "postgresql://postgres:password@localhost:5432/app",
        nodeEnv: "development",
        platform: "linux",
      }),
    ).toEqual({
      prepare: true,
      max: 5,
      connect_timeout: 10,
      idle_timeout: 20,
    });
  });

  it("forces IPv4 127.0.0.1 for localhost URLs on Windows", () => {
    expect(
      resolveDbOptions({
        url: "postgresql://postgres:password@localhost:5432/app",
        nodeEnv: "test",
        platform: "win32",
      }),
    ).toEqual({
      prepare: true,
      max: 5,
      connect_timeout: 10,
      idle_timeout: 20,
      host: "127.0.0.1",
    });
  });

  it("disables prepared statements for transaction pooler URLs", () => {
    expect(
      resolveDbOptions({
        url: "postgresql://postgres.ref:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
        nodeEnv: "production",
        platform: "linux",
      }),
    ).toMatchObject({ prepare: false, max: 10 });

    expect(
      resolveDbOptions({
        url: "postgresql://postgres:pw@db.example.com:5432/postgres?pgbouncer=true",
        nodeEnv: "production",
        platform: "linux",
      }),
    ).toMatchObject({ prepare: false, max: 10 });
  });

  it("honours explicit prepareStatements and maxConnections overrides", () => {
    expect(
      resolveDbOptions({
        url: "postgresql://postgres:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
        prepareStatements: true,
        maxConnections: 20,
        nodeEnv: "production",
        platform: "linux",
      }),
    ).toMatchObject({ prepare: true, max: 20 });
  });
});
