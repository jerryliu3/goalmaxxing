import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cssTokenNames,
  darkTheme,
  lightTheme,
  type ThemeTokenName,
} from "@cadence/shared/tokens";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const globalsCss = readFileSync(join(repoRoot, "src/app/globals.css"), "utf8");

// These fixtures are the CSS source of truth, verbatim (oklch() for most
// tokens, hex for the Gazetteer brand tokens primary/secondary/ring — see
// #780). If you update a fixture, re-derive the matching hex in
// packages/shared/src/tokens.ts — this test does not pair them.
const lightThemeCssValues: Record<ThemeTokenName, string> = {
  background: "oklch(0.985 0.003 286)",
  foreground: "oklch(0.22 0.01 286)",
  card: "oklch(0.995 0.002 286)",
  cardForeground: "oklch(0.22 0.01 286)",
  popover: "oklch(0.995 0.002 286)",
  popoverForeground: "oklch(0.22 0.01 286)",
  primary: "#0f64bf",
  primaryForeground: "#ffffff",
  secondary: "#e4e4e7",
  secondaryForeground: "#3f3f46",
  muted: "oklch(0.95 0.008 286)",
  mutedForeground: "oklch(0.5 0.01 286)",
  accent: "oklch(0.92 0.018 255)",
  accentForeground: "oklch(0.28 0.01 286)",
  destructive: "oklch(0.6 0.21 28)",
  border: "oklch(0.89 0.008 286)",
  input: "oklch(0.89 0.008 286)",
  ring: "#0f64bf",
};

const darkThemeCssValues: Record<ThemeTokenName, string> = {
  background: "oklch(0.19 0.01 286)",
  foreground: "oklch(0.96 0.003 286)",
  card: "oklch(0.24 0.01 286)",
  cardForeground: "oklch(0.96 0.003 286)",
  popover: "oklch(0.24 0.01 286)",
  popoverForeground: "oklch(0.96 0.003 286)",
  primary: "#4687d8",
  primaryForeground: "#0b1f38",
  secondary: "#3f3f46",
  secondaryForeground: "#e4e4e7",
  muted: "oklch(0.3 0.01 286)",
  mutedForeground: "oklch(0.75 0.01 286)",
  accent: "oklch(0.36 0.03 255)",
  accentForeground: "oklch(0.96 0.003 286)",
  destructive: "oklch(0.72 0.19 25)",
  border: "oklch(0.36 0.01 286)",
  input: "oklch(0.36 0.01 286)",
  ring: "#4687d8",
};

function extractThemeBlock(selector: string) {
  const start = globalsCss.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = globalsCss.indexOf("{", start);
  expect(open).toBeGreaterThan(start);
  let depth = 0;
  for (let index = open; index < globalsCss.length; index += 1) {
    const char = globalsCss[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return globalsCss.slice(open, index + 1);
      }
    }
  }
  throw new Error(`Unclosed theme block for ${selector}`);
}

function readCssToken(block: string, cssName: string) {
  const match = block.match(new RegExp(`${cssName}:\\s*([^;]+);`));
  return match?.[1]?.trim() ?? null;
}

describe("design token drift", () => {
  it("keeps shared light-theme values aligned with globals.css", () => {
    const block = extractThemeBlock(":root {");
    for (const [tokenName, cssName] of Object.entries(cssTokenNames) as Array<
      [ThemeTokenName, string]
    >) {
      expect(readCssToken(block, cssName)).toBe(lightThemeCssValues[tokenName]);
      expect(lightTheme[tokenName]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("keeps shared dark-theme values aligned with globals.css", () => {
    const block = extractThemeBlock(".dark {");
    for (const [tokenName, cssName] of Object.entries(cssTokenNames) as Array<
      [ThemeTokenName, string]
    >) {
      expect(readCssToken(block, cssName)).toBe(darkThemeCssValues[tokenName]);
      expect(darkTheme[tokenName]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
