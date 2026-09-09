import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("showcase-theme.css", () => {
  const css = readFileSync(
    resolve(process.cwd(), "src/features/achievements/showcase-theme.css"),
    "utf8"
  );

  it("defines adaptive production tokens and a study override", () => {
    expect(css).toContain(".ach-showcase-root {");
    expect(css).toContain(".gm-gazetteer .ach-showcase-root:not(.ach-showcase-root--study)");
    expect(css).toContain(".dark .ach-showcase-root:not(.ach-showcase-root--study)");
    expect(css).toContain(".ach-showcase-root--study");
    expect(css).toContain("var(--background)");
    expect(css).toContain("var(--primary)");
  });
});
