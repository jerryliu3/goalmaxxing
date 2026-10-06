import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FONTS, renderThemeCss } from "@cadence/shared/brand";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("web theme sources", () => {
  it("ships the stylesheet generated from the registry (run `pnpm themes:css`)", () => {
    const generated = readFileSync(join(repoRoot, "src/app/themes.css"), "utf8");
    expect(generated).toBe(renderThemeCss());
  });

  it("bundles every live face under its registry variable, and no study face", () => {
    const loaders = readFileSync(join(repoRoot, "src/lib/brand/fonts.ts"), "utf8");
    for (const font of Object.values(FONTS) as { cssVariable: string; googleWeights?: unknown }[]) {
      expect(loaders.includes(`variable: "${font.cssVariable}"`)).toBe(!font.googleWeights);
    }
  });
});
