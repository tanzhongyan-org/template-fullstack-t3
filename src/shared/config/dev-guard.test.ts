import { describe, expect, it } from "vitest";
import { assertLocalDev, devShortcutsEnabled } from "./dev-guard";

describe("dev shortcut guard", () => {
  it("is on for local development only", () => {
    expect(devShortcutsEnabled({ nodeEnv: "development", vercelEnv: undefined })).toBe(true);
  });

  it("is off in production, preview, and test", () => {
    expect(devShortcutsEnabled({ nodeEnv: "production", vercelEnv: undefined })).toBe(false);
    expect(devShortcutsEnabled({ nodeEnv: "development", vercelEnv: "production" })).toBe(false);
    expect(devShortcutsEnabled({ nodeEnv: "development", vercelEnv: "preview" })).toBe(false);
    expect(devShortcutsEnabled({ nodeEnv: "test", vercelEnv: undefined })).toBe(false);
  });

  it("assertLocalDev throws outside local development", () => {
    expect(() => assertLocalDev({ nodeEnv: "production", vercelEnv: undefined })).toThrow();
    expect(() => assertLocalDev({ nodeEnv: "development", vercelEnv: undefined })).not.toThrow();
  });
});
