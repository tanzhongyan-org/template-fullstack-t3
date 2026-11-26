import { expect, test } from "@playwright/test";

/** Smoke: landing, legal, health, 404, and no scaffold defaults. */
test("landing renders the brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Example/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Example");
  await expect(page.getByText("Create T3 App")).toHaveCount(0);
});

test("landing links to the example page", async ({ page }) => {
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

test("health answers ok with x-request-id", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(response.headers()["x-request-id"]).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ ok: true });
});

test("unknown routes render the 404 page", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Page not found");
});
