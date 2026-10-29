import { expect, test } from "@playwright/test";

/**
 * Nav crawler: every sitemap URL answers 200 with no console errors and no
 * scaffold-default title. Auth-gated demo routes (/examples, /notes) render
 * the signed-out state without an identity header, so they are checked for
 * reachability and title only.
 */
test("sitemap routes are clean", async ({ page, request, baseURL }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");
  expect(locs.length).toBeGreaterThan(0);
  // The sitemap holds canonical URLs; crawl the same paths on this target.
  const urls = locs.map((loc) => {
    const path = new URL(loc).pathname;
    return `${baseURL}${path === "/" ? "" : path}`;
  });

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${page.url()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));

  for (const url of urls) {
    const response = await page.goto(url, { waitUntil: "networkidle" });
    expect(response?.status(), url).toBe(200);
    const title = await page.title();
    expect(title, url).not.toContain("Create T3 App");
    expect(title, url).not.toHaveLength(0);
  }
  expect(errors).toEqual([]);
});

test("demo routes are reachable", async ({ page }) => {
  for (const path of ["/examples", "/notes"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveCount(0);
  }
});
