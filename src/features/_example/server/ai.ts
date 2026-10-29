/**
 * Fake model for the example slice. Unit tests and evals run against this;
 * derived features swap it for a real provider call and keep recordUsage.
 */
export function fakeComplete(prompt: string): string {
  return `Example answer to: ${prompt.slice(0, 120)}`;
}
