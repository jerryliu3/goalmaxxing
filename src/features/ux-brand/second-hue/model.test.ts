import { describe, expect, it } from "vitest";
import { THEMES } from "@cadence/shared/brand";
import {
  accentCandidates,
  contrastRatio,
  HUE_JOBS,
  HUE_MIXES,
  HUE_TONES,
  hueBoardStyle,
  hueReadout,
  jobAsPrimary,
  LABEL_CONTRAST,
  LINE_CONTRAST,
  matchingMixId,
  MIN_SHADE_SEPARATION,
  PROPOSED_MIX,
  resolvePalette,
  SHIPPED_MIX,
  themeHex,
} from "./model";

const TONE_IDS = HUE_TONES.map((tone) => tone.id);

describe("second hue mixes", () => {
  it("gives every mix a tone for every job", () => {
    for (const option of HUE_MIXES) {
      for (const job of HUE_JOBS) {
        expect(TONE_IDS, `${option.id}.${job.id}`).toContain(option.mix[job.id]);
      }
    }
  });

  it("matches named mixes and reports custom mixes as unnamed", () => {
    expect(matchingMixId(SHIPPED_MIX)).toBe("shipped");
    expect(matchingMixId(PROPOSED_MIX)).toBe("proposal");
    expect(matchingMixId({ ...SHIPPED_MIX, focus: "ink" })).toBeNull();
  });

  it("separates the two selection mixes by strength alone", () => {
    const solid = HUE_MIXES.find((option) => option.id === "selection-solid")!.mix;
    const tint = HUE_MIXES.find((option) => option.id === "selection-tint")!.mix;
    expect(HUE_JOBS.filter((job) => solid[job.id] !== tint[job.id]).map((job) => job.id)).toEqual(["place"]);
    expect([solid.place, tint.place]).toEqual(["accent", "accentTint"]);
  });

  it("captures identity at the board root so re-pointing primary cannot cycle", () => {
    const board = hueBoardStyle(SHIPPED_MIX, resolvePalette("kiln", "registry")) as Record<string, string>;
    expect(board["--hue-identity"]).toBe("var(--primary)");
    expect(board["--job-act-fill"]).toBe("var(--hue-identity)");
    expect(board["--job-place-line"]).toBe("var(--hue-ink)");
    expect((jobAsPrimary("act", "fill") as Record<string, string>)["--primary"]).toBe("var(--job-act-fill)");
  });

  it("falls back to the selected swatch when a theme has no accent", () => {
    const board = hueBoardStyle(PROPOSED_MIX, resolvePalette("original", "none")) as Record<string, string>;
    expect(board["--job-place-fill"]).toBe("var(--hue-selected)");
    expect(board["--job-place-line"]).toBe("var(--hue-identity)");
    const withAccent = hueBoardStyle(PROPOSED_MIX, resolvePalette("kiln", "registry")) as Record<string, string>;
    expect(withAccent["--job-place-fill"]).toBe("var(--hue-accent)");
    expect(withAccent["--job-pick-fill"]).toBe("var(--hue-selected)");
    expect(withAccent["--job-place-line"]).toBe("var(--hue-accent-line)");
  });

  it("goes solid only where the shade vanishes into the card", () => {
    for (const id of ["opaline", "bloodstone"] as const) {
      const palette = resolvePalette(id, "registry");
      expect(hueReadout(id, palette).shadeSeparation, id).toBeLessThan(MIN_SHADE_SEPARATION);
      expect(palette.selected.fill, id).toBe(themeHex(id, "primary"));
    }
    for (const id of ["original", "gazetteer", "undertow", "kiln"] as const) {
      const palette = resolvePalette(id, "registry");
      expect(palette.selected, id).toEqual(palette.shade);
    }
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

  it("finds that Original's registry accent is its identity", () => {
    expect(hueReadout("original", resolvePalette("original", "registry")).separation).toBe(1);
  });

  it("derives a drawable line where the registry accent is fill-only", () => {
    for (const id of ["court", "opaline"] as const) {
      const palette = resolvePalette(id, "registry");
      expect(contrastRatio(palette.accent.fill, themeHex(id, "page")!), id).toBeLessThan(LINE_CONTRAST);
      expect(palette.accent.line, id).not.toBe(palette.accent.fill);
      expect(hueReadout(id, palette).accentLine, id).toBeGreaterThanOrEqual(LINE_CONTRAST);
    }
  });

  it("keeps every accent drawable as a line and readable as a tint", () => {
    for (const theme of THEMES) {
      for (const candidate of accentCandidates(theme.id).filter((option) => option.id !== "none")) {
        const readout = hueReadout(theme.id, resolvePalette(theme.id, candidate.id));
        expect(readout.accentLine, `${theme.id}.${candidate.id}`).toBeGreaterThanOrEqual(LINE_CONTRAST);
        expect(readout.accentTintLabel, `${theme.id}.${candidate.id}`).toBeGreaterThanOrEqual(LABEL_CONTRAST);
      }
    }
  });

  it("keeps ink readable on every theme's shade", () => {
    for (const theme of THEMES) {
      const palette = resolvePalette(theme.id, "registry");
      expect(palette.shade.onFill, theme.id).toBe(themeHex(theme.id, "foreground"));
      expect(hueReadout(theme.id, palette).shadeLabel, theme.id).toBeGreaterThanOrEqual(LABEL_CONTRAST);
    }
  });

  it("labels authored solid accents legibly", () => {
    for (const id of ["original", "gazetteer"] as const) {
      for (const candidate of accentCandidates(id).filter((option) => option.fill)) {
        const readout = hueReadout(id, resolvePalette(id, candidate.id));
        expect(readout.accentLabel, `${id}.${candidate.id}`).toBeGreaterThanOrEqual(LABEL_CONTRAST);
      }
    }
  });
});
