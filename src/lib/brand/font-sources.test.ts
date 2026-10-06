import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Production text must take its typeface from the active theme. Only the theme
 * definitions may name a concrete family; everything else uses the theme-aware
 * variables (`--font-app-*`, `--font-sans/display/mono`) or Tailwind's
 * `font-sans` / `font-display` / `font-mono`.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = join(repoRoot, "src");

// Generated from packages/shared/src/brand, the one place families are named.
const THEME_DEFINITION_FILES = new Set(["src/app/themes.css"]);
// Design studies and prototypes intentionally render fixed, named type.
const EXEMPT_PREFIXES = [
  "src/app/ux/",
  "src/app/prototype/",
  "src/features/coach-prototype/",
];
const EXEMPT_PATTERN = /^src\/features\/ux-[^/]+\//;

const CONCRETE_FONT_VARIABLE =
  /var\(--font-(geist-sans|geist-mono|newsreader|source-sans|plex-mono)\)/;
const FONT_FAMILY_DECLARATION = /font-family:\s*([^;}]+)/g;
const FONT_SHORTHAND_DECLARATION = /(?<![-\w])font:\s*([^;}]+)/g;
const INLINE_FONT_FAMILY = /fontFamily[=:]\s*["'`]([^"'`]*)/g;
const ARBITRARY_FONT_CLASS = /font-\[(family-name:|["'A-Z])/;

function productionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return productionFiles(path);
    }
    return /\.(css|tsx?)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

function isThemeAware(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("var(") || trimmed === "inherit";
}

function findViolations(file: string, source: string) {
  const violations: string[] = [];
  if (CONCRETE_FONT_VARIABLE.test(source)) {
    violations.push(`${file}: names a theme's concrete font variable`);
  }
  if (ARBITRARY_FONT_CLASS.test(source)) {
    violations.push(`${file}: uses an arbitrary Tailwind font family`);
  }
  for (const match of source.matchAll(FONT_FAMILY_DECLARATION)) {
    if (!isThemeAware(match[1])) {
      violations.push(`${file}: font-family: ${match[1].trim()}`);
    }
  }
  for (const match of source.matchAll(FONT_SHORTHAND_DECLARATION)) {
    if (!match[1].includes("var(") && match[1].trim() !== "inherit") {
      violations.push(`${file}: font: ${match[1].trim()}`);
    }
  }
  for (const match of source.matchAll(INLINE_FONT_FAMILY)) {
    if (!isThemeAware(match[1])) {
      violations.push(`${file}: fontFamily ${match[1]}`);
    }
  }
  return violations;
}

describe("theme font sources", () => {
  it("keeps concrete typefaces inside the theme definitions", () => {
    const violations = productionFiles(srcRoot).flatMap((path) => {
      const file = relative(repoRoot, path);
      if (
        THEME_DEFINITION_FILES.has(file) ||
        EXEMPT_PREFIXES.some((prefix) => file.startsWith(prefix)) ||
        EXEMPT_PATTERN.test(file)
      ) {
        return [];
      }
      return findViolations(file, readFileSync(path, "utf8"));
    });

    expect(violations).toEqual([]);
  });

  it("flags the leaks this guard exists for", () => {
    expect(
      findViolations("a.css", '.card { font-family: "Avenir Next", sans-serif; }')
    ).toHaveLength(1);
    expect(findViolations("a.css", ".steps { font-family: monospace; }")).toHaveLength(1);
    expect(
      findViolations("a.css", ".label { font: 500 9px var(--font-plex-mono), monospace; }")
    ).toHaveLength(1);
    expect(findViolations("a.tsx", '<text fontFamily="Inter" />')).toHaveLength(1);
    expect(
      findViolations("a.css", ".ok { font-family: var(--font-app-display); font: inherit; }")
    ).toEqual([]);
  });
});
