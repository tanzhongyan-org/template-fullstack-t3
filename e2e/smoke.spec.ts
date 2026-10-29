import { expect, test } from "@playwright/test";

/** Smoke: landing, legal, health, 404, and no scaffold defaults. */
test("landing renders the brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Example/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Example");
  await expect(page.getByText("No notes yet")).toHaveCount(0);
  await expect(page.getByText("Create T3 App")).toHaveCount(0);
});

test("landing links to the example and demo pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See the example" }).click();
  await expect(page).toHaveURL(/\/examples/);
});

test("privacy page renders from the site config", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Privacy Policy");
});

test("terms and refund pages render", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Terms of Service");
  await page.goto("/refund");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Refund Policy");
});

test("health answers ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({ ok: true });
});

test("unknown routes render the 404 page", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Page not found");
});

test("waitlist form submits", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill(`smoke-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.getByRole("status")).toContainText("on the list");
});
