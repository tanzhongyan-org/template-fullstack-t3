import { describe, expect, it } from "vitest";
import { fakeComplete } from "~/features/_example/server/ai";
import cases from "./cases.json";

/**
 * Golden-case evals for the example AI answer. Derived products score their
 * own model here on the cheapest tier; CI runs this file with the unit tests
 * and `make evals` runs it alone.
 */
describe("example evals", () => {
  for (const golden of cases as Array<{ id: string; prompt: string; mustContain: string }>) {
    it(`answers ${golden.id}`, () => {
      expect(fakeComplete(golden.prompt)).toContain(golden.mustContain);
    });
  }
});
