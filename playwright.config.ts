import { defineConfig } from "@playwright/test";

const baseURL = process.env.PREVIEW_URL ?? "http://localhost:3000";
const bypass = process.env.PREVIEW_BYPASS;
const bypassHeader = process.env.BYPASS_HEADER_NAME ?? "x-vercel-protection-bypass";

/**
 * Preview and local E2E. Against a branch preview, PREVIEW_URL and
 * PREVIEW_BYPASS come from the preview-checks workflow; locally, start
 * make dev and run make e2e.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "preview-checks/playwright", open: "never" }]],
  use: {
    baseURL,
    extraHTTPHeaders: bypass ? { [bypassHeader]: bypass } : undefined,
    trace: "retain-on-failure",
  },
});
