import { describe, expect, it } from "vitest";
import { renderStudyThemeCss, renderThemeCss } from "./css";
import { FONTS, googleFontsHref } from "./fonts";
import {
  APP_COLOR_ROLES,
  colorRoleVariable,
  SCALE_COLOR_ROLES,
  SURFACE_COLOR_ROLES,
  TEXT_ROLES,
  type ThemeDefinition,
} from "./roles";
import {
  DEFAULT_THEME_ID,
  GAZETTEER_THEME,
  getTheme,
  isThemeId,
  ORIGINAL_THEME,
  THEME_IDS,
  THEMES,
} from "./themes";
import { contrastRatio, MIN_SHADE_SEPARATION } from "./themes/study";

const ROLES = [...SURFACE_COLOR_ROLES, ...APP_COLOR_ROLES, ...SCALE_COLOR_ROLES];
const ALL_THEMES: readonly ThemeDefinition[] = THEMES;

describe("theme registry", () => {
  it("fills every color role in every palette", () => {
    for (const theme of ALL_THEMES) {
      for (const colors of [theme.colors, theme.darkColors].filter(Boolean)) {
        for (const role of ROLES) {
          expect(colors?.[role], `${theme.id}.${role}`).toMatch(/\S/);
        }
      }
    }
  });

  it("styles every text role with a font slot and weight", () => {
    for (const theme of THEMES) {
      for (const role of TEXT_ROLES) {
        expect(["sans", "display", "mono"]).toContain(theme.text[role].slot);
        expect(theme.text[role].weight).toBeGreaterThanOrEqual(300);
      }
    }
  });

  it("uses only registered fonts", () => {
    for (const theme of THEMES) {
      for (const font of Object.values(theme.fonts)) {
        expect(FONTS).toHaveProperty(font);
      }
    }
  });

  it("keeps ids unique and defaults to Original", () => {
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length);
    expect(DEFAULT_THEME_ID).toBe("original");
    expect(isThemeId("gazetteer")).toBe(true);
    expect(isThemeId("col")).toBe(false);
    expect(getTheme("gazetteer").fonts.display).toBe("newsreader");
  });

  it("keeps Original and Gazetteer live and the six shortlisted study skins opt-in", () => {
    expect(ALL_THEMES.filter((theme) => theme.status === "live").map((theme) => theme.id)).toEqual([
      "original",
      "gazetteer",
    ]);
    expect(ALL_THEMES.filter((theme) => theme.status === "study")).toHaveLength(6);
    // Study ids stay literal, so a typo is a type error rather than a fallback.
    expect(getTheme("pitlane").label).toBe("Pitlane");
  });

  it("derives study roles from the authored palette, keeping cards readable", () => {
    const pitlane = getTheme("pitlane");
    expect(pitlane.colors.primary).toBe("#385acc");
    expect(pitlane.colors.selection).toBe("#deef79");
    expect(pitlane.colors.secondary).not.toBe(pitlane.colors.selection);
    // Pitlane's study cards are lime on asphalt; live cards stay on the page's side.
    expect(pitlane.colors.card).not.toBe("#deef79");
    expect(pitlane.colors.cardForeground).toBe(pitlane.colors.foreground);
    // Undertow's cards already read on its page and keep the authored surface.
    expect(getTheme("undertow").colors.card).toBe("#16364a");
  });

  it("keeps the roles native reads as plain hex React Native can paint", () => {
    const nativeRoles = [...SURFACE_COLOR_ROLES, "page", "gain", "recover"] as const;
    for (const colors of [GAZETTEER_THEME.colors, GAZETTEER_THEME.darkColors]) {
      for (const role of nativeRoles) {
        expect(colors[role], role).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("maps roles onto the CSS variables components already use", () => {
    expect(colorRoleVariable("cardForeground")).toBe("--card-foreground");
    expect(colorRoleVariable("warningFill")).toBe("--gm-warning-fill");
    expect(colorRoleVariable("heatmap3")).toBe("--gm-heatmap-3");
  });
});

describe("second hue roles", () => {
  const STUDY_THEMES = ALL_THEMES.filter((theme) => theme.status === "study");

  it("gives the live themes no second hue: both selections are the identity shade", () => {
    for (const [theme, shade] of [
      [ORIGINAL_THEME, "#d0dff1"],
      [GAZETTEER_THEME, "#ead9cc"],
    ] as const) {
      expect(theme.colors.selection, theme.id).toBe(shade);
      expect(theme.colors.daySelected, theme.id).toBe(shade);
      expect(theme.colors.selectionForeground).toBe("var(--foreground)");
      expect(theme.colors.daySelectedForeground).toBe("var(--foreground)");
      expect(theme.colors.selectionLine).toBe("var(--primary)");
    }
  });

  it("keeps the registry accent where it stays in balance, and Bloodstone on its identity", () => {
    expect(getTheme("undertow").colors.selection).toBe("#b4a6ee");
    expect(getTheme("kiln").colors.selection).toBe("#a8c1f5");
    expect(getTheme("court").colors.selection).toBe("#dced65");
    expect(getTheme("opaline").colors.selection).toBe("#86d6ce");
    expect(getTheme("pitlane").colors.selection).toBe("#deef79");
    const bloodstone = getTheme("bloodstone").colors;
    expect(bloodstone.selection).toBe(bloodstone.primary);
    expect(bloodstone.selectionForeground).toBe(bloodstone.primaryForeground);
  });

  it("fills the selected row solid only where the shade would vanish into the card", () => {
    for (const theme of STUDY_THEMES) {
      const { daySelected, primary, card } = theme.colors;
      const solid = theme.id === "opaline" || theme.id === "bloodstone";
      expect(daySelected === primary, theme.id).toBe(solid);
      if (!solid) {
        expect(contrastRatio(daySelected, card), theme.id).toBeGreaterThanOrEqual(MIN_SHADE_SEPARATION);
      }
    }
  });

  it("keeps every study selection legible: labels at 4.5:1, rules at 3:1 on the page", () => {
    for (const theme of STUDY_THEMES) {
      const colors = theme.colors;
      expect(contrastRatio(colors.selectionForeground, colors.selection), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.daySelectedForeground, colors.daySelected), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.selectionLine, colors.page), theme.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("derives a darker rule only where the accent is too pale to draw one", () => {
    expect(getTheme("pitlane").colors.selectionLine).toBe("#deef79");
    expect(getTheme("court").colors.selectionLine).not.toBe("#dced65");
    expect(getTheme("opaline").colors.selectionLine).not.toBe("#86d6ce");
  });
});

describe("theme stylesheet", () => {
  const css = renderThemeCss();

  it("puts the default theme on :root and scopes the rest by data attribute", () => {
    expect(css).toContain(':root,\n[data-ui-style="original"] {');
    expect(css).toContain('\n[data-ui-style="gazetteer"] {');
    // The web app has no dark mode; dark palettes are for native only.
    expect(css).not.toContain(".dark");
    // Study skins are not in the shipped stylesheet.
    expect(css).not.toContain('[data-ui-style="pitlane"]');
  });

  it("resolves each theme's type slots to its own faces", () => {
    expect(css).toContain(
      '--font-app-display: var(--font-newsreader), Georgia, "Times New Roman", serif;'
    );
    expect(css).toContain("--font-app-display: var(--font-geist-sans), Inter, system-ui, sans-serif;");
    expect(css).toContain("--font-display: var(--font-app-display);");
  });

  it("generates one utility per text role that reads the active theme", () => {
    for (const role of TEXT_ROLES) {
      expect(css).toContain(`@utility type-${role} {`);
      expect(css).toContain(`font-weight: var(--type-${role}-weight);`);
    }
    expect(css).toContain("--type-title-weight: 500;");
    expect(css).toContain("--type-stat-font: var(--font-app-display);");
    // Gazetteer sets small figures in its sans, so the theme reads as two faces.
    expect(css).toContain("--type-figure-font: var(--font-app-sans);");
  });

  it("exposes Tailwind utilities for surface and app roles", () => {
    expect(css).toContain("--color-card-foreground: var(--card-foreground);");
    expect(css).toContain("--color-day-selected: var(--gm-day-selected);");
    expect(css).not.toContain("--color-heatmap-0");
  });
});

describe("study theme assets", () => {
  it("scopes each study skin above the default theme and names its faces", () => {
    const css = renderStudyThemeCss();
    expect(css).toContain(':root[data-ui-style="pitlane"],\n[data-ui-style="pitlane"] {');
    expect(css).toContain('--font-barlow-condensed: "Barlow Condensed";');
    expect(css).toContain("color-scheme: dark;");
    expect(css).not.toContain('[data-ui-style="original"]');
  });

  it("requests only Google faces, at their published weights", () => {
    const href = googleFontsHref(["dm-sans", "instrument-serif", "geist"]);
    expect(href).toBe(
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:wght@400&display=swap"
    );
  });
});
