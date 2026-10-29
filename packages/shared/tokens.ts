/**
 * Brand color tokens: the single source of truth for every color in the product.
 *
 * Each token holds a light and a dark value as an `oklch()` color. `make tokens`
 * generates the web stylesheet and the Uniwind stylesheet from this file; never
 * edit the generated files by hand. `make contrast` fails any text pair below
 * WCAG 2.2 AA in either theme.
 *
 * TEMPLATE-BRAND(colors): replace these neutral values with the palette from
 * DESIGN.md, then run `make tokens` and `make contrast`.
 */
export interface ThemeValues {
  light: string;
  dark: string;
}

export const tokens = {
  background: { light: "oklch(1 0 0)", dark: "oklch(0.145 0 0)" },
  foreground: { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
  card: { light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)" },
  "card-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
  popover: { light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)" },
  "popover-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
  primary: { light: "oklch(0.205 0 0)", dark: "oklch(0.922 0 0)" },
  "primary-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.205 0 0)" },
  secondary: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "secondary-foreground": { light: "oklch(0.205 0 0)", dark: "oklch(0.985 0 0)" },
  muted: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "muted-foreground": { light: "oklch(0.47 0 0)", dark: "oklch(0.75 0 0)" },
  accent: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "accent-foreground": { light: "oklch(0.205 0 0)", dark: "oklch(0.985 0 0)" },
  destructive: { light: "oklch(0.55 0.22 27)", dark: "oklch(0.7 0.19 22)" },
  "destructive-foreground": { light: "oklch(1 0 0)", dark: "oklch(0.16 0 0)" },
  border: { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 10%)" },
  input: { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 15%)" },
  ring: { light: "oklch(0.708 0 0)", dark: "oklch(0.556 0 0)" },
  info: { light: "oklch(0.45 0.16 260)", dark: "oklch(0.75 0.14 260)" },
  success: { light: "oklch(0.45 0.16 150)", dark: "oklch(0.75 0.15 150)" },
  warning: { light: "oklch(0.5 0.16 85)", dark: "oklch(0.8 0.15 85)" },
  error: { light: "oklch(0.5 0.2 27)", dark: "oklch(0.7 0.19 22)" },
  "chart-1": { light: "oklch(0.55 0 0)", dark: "oklch(0.87 0 0)" },
  "chart-2": { light: "oklch(0.45 0 0)", dark: "oklch(0.7 0 0)" },
  "chart-3": { light: "oklch(0.35 0 0)", dark: "oklch(0.55 0 0)" },
  "chart-4": { light: "oklch(0.65 0 0)", dark: "oklch(0.45 0 0)" },
  "chart-5": { light: "oklch(0.269 0 0)", dark: "oklch(0.35 0 0)" },
  sidebar: { light: "oklch(0.985 0 0)", dark: "oklch(0.205 0 0)" },
  "sidebar-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
  "sidebar-primary": { light: "oklch(0.205 0 0)", dark: "oklch(0.488 0.243 264.376)" },
  "sidebar-primary-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.985 0 0)" },
  "sidebar-accent": { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "sidebar-accent-foreground": { light: "oklch(0.205 0 0)", dark: "oklch(0.985 0 0)" },
  "sidebar-border": { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 10%)" },
  "sidebar-ring": { light: "oklch(0.708 0 0)", dark: "oklch(0.556 0 0)" },
} as const satisfies Record<string, ThemeValues>;

export type TokenName = keyof typeof tokens;

export interface ContrastPair {
  /** Token drawn as text or the meaningful foreground. */
  foreground: TokenName;
  /** Token it is drawn on. */
  background: TokenName;
  /** Minimum WCAG contrast ratio: 4.5 for text, 3.0 for large text and UI. */
  minimum: number;
}

/** Every pair `make contrast` checks in both themes. */
const contrastPairs: ContrastPair[] = [
  { foreground: "foreground", background: "background", minimum: 4.5 },
  { foreground: "card-foreground", background: "card", minimum: 4.5 },
  { foreground: "popover-foreground", background: "popover", minimum: 4.5 },
  { foreground: "primary-foreground", background: "primary", minimum: 4.5 },
  { foreground: "secondary-foreground", background: "secondary", minimum: 4.5 },
  { foreground: "muted-foreground", background: "muted", minimum: 4.5 },
  { foreground: "accent-foreground", background: "accent", minimum: 4.5 },
  { foreground: "destructive-foreground", background: "destructive", minimum: 4.5 },
  { foreground: "info", background: "background", minimum: 4.5 },
  { foreground: "success", background: "background", minimum: 4.5 },
  { foreground: "warning", background: "background", minimum: 4.5 },
  { foreground: "error", background: "background", minimum: 4.5 },
  { foreground: "sidebar-foreground", background: "sidebar", minimum: 4.5 },
  { foreground: "sidebar-primary-foreground", background: "sidebar-primary", minimum: 4.5 },
  { foreground: "sidebar-accent-foreground", background: "sidebar-accent", minimum: 4.5 },
];

const oklchPattern = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/;

function parseOklch(color: string): { l: number; c: number; h: number } {
  const match = oklchPattern.exec(color);
  if (!match?.[1] || match[2] === undefined || match[3] === undefined) {
    throw new Error(`Token value is not oklch(): ${color}`);
  }
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

/** Relative luminance of an oklch() color, following the WCAG definition. */
function relativeLuminance(color: string): number {
  const { l, c, h } = parseOklch(color);
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  // Oklab to linear sRGB.
  const lmsL = l + 0.3963377774 * a + 0.2158037573 * b;
  const lmsM = l - 0.1055613458 * a - 0.0638541728 * b;
  const lmsS = l - 0.0894841775 * a - 1.291485548 * b;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * lmsL ** 3 - 3.3077115913 * lmsM ** 3 + 0.2309699292 * lmsS ** 3);
  const g = clamp(-1.2684380046 * lmsL ** 3 + 2.6097574011 * lmsM ** 3 - 0.3413193965 * lmsS ** 3);
  const bl = clamp(-0.0041960863 * lmsL ** 3 - 0.7034186147 * lmsM ** 3 + 1.707614701 * lmsS ** 3);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

/** WCAG contrast ratio between two oklch() colors, from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export interface PairResult extends ContrastPair {
  theme: "light" | "dark";
  ratio: number;
  pass: boolean;
}

/** Check every contrast pair in both themes. */
export function checkContrastPairs(): PairResult[] {
  const results: PairResult[] = [];
  for (const theme of ["light", "dark"] as const) {
    for (const pair of contrastPairs) {
      const ratio = contrastRatio(tokens[pair.foreground][theme], tokens[pair.background][theme]);
      results.push({ ...pair, theme, ratio, pass: ratio >= pair.minimum });
    }
  }
  return results;
}
