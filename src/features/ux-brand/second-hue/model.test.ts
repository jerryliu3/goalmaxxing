import { describe, expect, it } from "vitest";
import { THEMES } from "@cadence/shared/brand";
import {
  contrastRatio,
  HUE_JOBS,
  HUE_MIXES,
  hueBoardStyle,
  hueReadout,
  jobAsPrimary,
  LABEL_CONTRAST,
  LINE_CONTRAST,
  matchingMixId,
  resolveSecondHue,
  secondHueCandidates,
  SHIPPED_MIX,
  themeHex,
} from "./model";

describe("second hue mixes", () => {
  it("gives every mix a tone for every job", () => {
    for (const option of HUE_MIXES) {
      for (const job of HUE_JOBS) {
        expect(option.mix[job.id], `${option.id}.${job.id}`).toMatch(/identity|second|ink/);
      }
    }
  });

  it("matches the shipped mix and reports custom mixes as unnamed", () => {
    expect(matchingMixId(SHIPPED_MIX)).toBe("shipped");
    expect(matchingMixId({ ...SHIPPED_MIX, focus: "ink" })).toBeNull();
  });

  it("captures identity at the board root so re-pointing primary cannot cycle", () => {
    const board = hueBoardStyle(SHIPPED_MIX, { fill: "#111111", onFill: "#ffffff", line: "#111111" }) as Record<string, string>;
    expect(board["--hue-identity"]).toBe("var(--primary)");
    expect(board["--job-act-fill"]).toBe("var(--hue-identity)");
    expect(board["--job-place-line"]).toBe("var(--hue-ink)");
    expect((jobAsPrimary("act", "fill") as Record<string, string>)["--primary"]).toBe("var(--job-act-fill)");
  });
});

describe("second hue color math", () => {
  it("measures WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#0f64bf", "#0f64bf")).toBe(1);
  });

  it("resolves theme roles through var() references and oklch", () => {
    expect(themeHex("original", "selection")).toBe("#0f64bf");
    expect(contrastRatio(themeHex("original", "primary")!, themeHex("original", "page")!)).toBeGreaterThan(5);
  });

  it("finds that Original has no second hue of its own", () => {
    const hue = resolveSecondHue("original", "registry");
    expect(hueReadout("original", hue).separation).toBe(1);
  });

  it("derives a drawable line where the authored second hue is fill-only", () => {
    for (const id of ["court", "opaline"] as const) {
      const hue = resolveSecondHue(id, "registry");
      const readout = hueReadout(id, hue);
      expect(readout.fillLine, id).toBeLessThan(LINE_CONTRAST);
      expect(hue.line, id).not.toBe(hue.fill);
      expect(readout.secondLine, id).toBeGreaterThanOrEqual(LINE_CONTRAST);
    }
  });

  it("gives every theme's registry hue a line that reads on its page", () => {
    for (const theme of THEMES) {
      const readout = hueReadout(theme.id, resolveSecondHue(theme.id, "registry"));
      expect(readout.secondLine, theme.id).toBeGreaterThanOrEqual(LINE_CONTRAST);
    }
  });

  it("keeps every explored candidate readable as a line and as a label", () => {
    for (const theme of THEMES) {
      for (const candidate of secondHueCandidates(theme.id).filter((option) => option.hue)) {
        const readout = hueReadout(theme.id, resolveSecondHue(theme.id, candidate.id));
        expect(readout.secondLine, `${theme.id}.${candidate.id}`).toBeGreaterThanOrEqual(LINE_CONTRAST);
        expect(readout.secondLabel, `${theme.id}.${candidate.id}`).toBeGreaterThanOrEqual(LABEL_CONTRAST);
      }
    }
  });

  it("separates tint candidates from identity by lightness, not hue alone", () => {
    for (const id of ["original", "gazetteer"] as const) {
      for (const candidate of secondHueCandidates(id)) {
        const separation = hueReadout(id, resolveSecondHue(id, candidate.id)).separation;
        if (candidate.form === "tint") expect(separation, `${id}.${candidate.id}`).toBeGreaterThan(2);
        if (candidate.form === "solid") expect(separation, `${id}.${candidate.id}`).toBeLessThan(1.5);
      }
    }
  });
});
