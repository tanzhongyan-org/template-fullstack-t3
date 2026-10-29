import { describe, expect, it } from "vitest";
import { checkContrastPairs, contrastRatio } from "./tokens";

describe("brand tokens", () => {
  it("rates black on white near the 21:1 maximum", () => {
    expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeGreaterThan(20);
  });

  it("passes every text pair at WCAG AA in both themes", () => {
    const failures = checkContrastPairs().filter((r) => !r.pass);
    expect(failures).toEqual([]);
  });
});
