import type { FontId } from "../fonts";
import {
  DEFAULT_GHOST_COLORS,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeText,
} from "../roles";

/**
 * Study skins are authored as the ten-color palettes from the UX brand
 * studies (/ux/brand). This derives every other role from that palette so a
 * skin can be used in the live app. Study status records their origin; it
 * does not gate the picker or a saved selection.
 */
export interface StudyPalette {
  page: string;
  /** The study's card surface; used only when it reads on the page. */
  surface: string;
  ink: string;
  surfaceInk: string;
  muted: string;
  primary: string;
  onPrimary: string;
  /** The skin's second hue; it marks where you are unless `selection` says otherwise. */
  secondHue: string;
  onSecondHue: string;
  border: string;
}

export interface StudySkin<Id extends string = string> {
  id: Id;
  label: string;
  description: string;
  appearance: "light" | "dark";
  fonts: { sans: FontId; display: FontId; mono: FontId };
  text: ThemeText;
  radiusPx: number;
  palette: StudyPalette;
  /**
   * What marks where you are (tabs, view switchers). Defaults to the second
   * hue; a skin whose second hue would out-shout its identity uses primary.
   */
  selection?: "second-hue" | "primary";
  pageBackgroundImage: string;
}

function channels(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

/** `amount` of `color` over `base`, as hex (native-safe, unlike color-mix). */
function mixHex(color: string, base: string, amount: number): string {
  const bottom = channels(base);
  return `#${channels(color)
    .map((channel, index) =>
      Math.round(channel * amount + bottom[index] * (1 - amount))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function isDark(hex: string) {
  const [red, green, blue] = channels(hex);
  return 0.299 * red + 0.587 * green + 0.114 * blue < 128;
}

function luminance(hex: string) {
  const [red, green, blue] = channels(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(first: string, second: string): number {
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/** Below this contrast against the card, a shaded selected row reads as unselected. */
export const MIN_SHADE_SEPARATION = 1.2;

/** The lightest blend of `fill` toward `ink` that reads as a rule (3:1) on `page`. */
function lineFor(fill: string, page: string, ink: string) {
  for (let step = 0; step <= 10; step += 1) {
    const candidate = mixHex(ink, fill, step / 10);
    if (contrastRatio(candidate, page) >= 3) return candidate;
  }
  return ink;
}

function studyColors({ palette, appearance, selection = "second-hue" }: StudySkin): ThemeColors {
  const { page, ink, primary } = palette;
  const dark = appearance === "dark";
  // Several studies invert their cards (light cards on a dark page, or the
  // reverse) while muted text and fills are derived from the page; keep such
  // cards on the page's side so everything inside them stays readable.
  const card =
    isDark(palette.surface) === isDark(page)
      ? { surface: palette.surface, ink: palette.surfaceInk }
      : { surface: mixHex(ink, page, 0.06), ink };
  const place =
    selection === "primary"
      ? { fill: primary, on: palette.onPrimary }
      : { fill: palette.secondHue, on: palette.onSecondHue };
  // What you picked is identity washed toward the page, solid where that
  // wash would vanish into the card.
  const shade = mixHex(primary, page, dark ? 0.4 : 0.18);
  const picked =
    contrastRatio(shade, card.surface) >= MIN_SHADE_SEPARATION
      ? { fill: shade, on: ink }
      : { fill: primary, on: palette.onPrimary };
  return {
    background: page,
    foreground: ink,
    card: card.surface,
    cardForeground: card.ink,
    popover: card.surface,
    popoverForeground: card.ink,
    primary,
    primaryForeground: palette.onPrimary,
    secondary: mixHex(ink, page, 0.12),
    secondaryForeground: ink,
    muted: mixHex(ink, page, 0.08),
    mutedForeground: palette.muted,
    accent: mixHex(palette.secondHue, page, 0.18),
    accentForeground: ink,
    destructive: dark ? "#ff969b" : "#a51f36",
    border: palette.border,
    input: palette.border,
    ring: primary,
    page,
    gain: dark ? "#34d399" : "#10b981",
    recover: dark ? "#facc15" : "#eab308",
    warning: dark ? "#facc15" : "#eab308",
    warningFill: mixHex(dark ? "#facc15" : "#eab308", page, 0.22),
    selection: place.fill,
    selectionForeground: place.on,
    selectionLine: lineFor(place.fill, page, ink),
    today: mixHex(primary, page, 0.28),
    todayForeground: ink,
    daySelected: picked.fill,
    daySelectedForeground: picked.on,
    adjacent: mixHex(ink, page, 0.14),
    adjacentForeground: palette.muted,
    stampLight: mixHex(primary, page, 0.6),
    ...DEFAULT_GHOST_COLORS,
    heatmap0: mixHex(ink, page, 0.08),
    heatmap1: mixHex(primary, page, 0.28),
    heatmap2: mixHex(primary, page, 0.6),
    heatmap3: primary,
    heatmap4: mixHex(primary, ink, 0.7),
  };
}

export function studyTheme<const Id extends string>(skin: StudySkin<Id>) {
  return {
    id: skin.id,
    label: skin.label,
    description: skin.description,
    status: "study",
    appearance: skin.appearance,
    fonts: skin.fonts,
    text: skin.text,
    radiusRem: skin.radiusPx / 16,
    colors: studyColors(skin),
    effects: { landingAtmosphere: skin.pageBackgroundImage },
    themeColor: skin.palette.page,
    backgroundColor: skin.palette.page,
    statusBarStyle: skin.appearance === "dark" ? "black-translucent" : "default",
    completionMark: "circle",
    tabChrome: "pills",
    remapDisplayColors: false,
  } as const satisfies ThemeDefinition;
}
