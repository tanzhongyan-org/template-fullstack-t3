import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** axe at mobile and desktop widths on the landing and a legal page. */
for (const path of ["/", "/privacy"]) {
  for (const width of [375, 1280]) {
    test(`a11y ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
