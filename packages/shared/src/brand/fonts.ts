/**
 * Every typeface a web theme may use. Live faces load through `next/font`
 * (src/lib/brand/fonts.ts, whose `variable` must equal `cssVariable`); study
 * faces (`googleWeights`) load from Google Fonts only while study themes are
 * enabled, so production pages never carry them. Native loads its Gazetteer
 * faces separately (apps/mobile/src/ui/gazetteer-fonts.tsx).
 */
export const FONTS = {
  geist: {
    family: "Geist",
    cssVariable: "--font-geist-sans",
    fallback: "Inter, system-ui, sans-serif",
  },
  "geist-mono": {
    family: "Geist Mono",
    cssVariable: "--font-geist-mono",
    fallback: "ui-monospace, monospace",
  },
  newsreader: {
    family: "Newsreader",
    cssVariable: "--font-newsreader",
    fallback: 'Georgia, "Times New Roman", serif',
  },
  "source-sans-3": {
    family: "Source Sans 3",
    cssVariable: "--font-source-sans",
    fallback: "Inter, system-ui, sans-serif",
  },
  "ibm-plex-mono": {
    family: "IBM Plex Mono",
    cssVariable: "--font-plex-mono",
    fallback: "ui-monospace, monospace",
  },
  // Study faces: loaded from Google Fonts only while study themes are enabled.
  "dm-sans": {
    family: "DM Sans",
    cssVariable: "--font-dm-sans",
    fallback: "Inter, system-ui, sans-serif",
    googleWeights: [400, 500, 600, 700],
  },
  "space-grotesk": {
    family: "Space Grotesk",
    cssVariable: "--font-space-grotesk",
    fallback: "Inter, system-ui, sans-serif",
    googleWeights: [400, 500, 600, 700],
  },
  "instrument-sans": {
    family: "Instrument Sans",
    cssVariable: "--font-instrument-sans",
    fallback: "Inter, system-ui, sans-serif",
    googleWeights: [400, 500, 600, 700],
  },
  manrope: {
    family: "Manrope",
    cssVariable: "--font-manrope",
    fallback: "Inter, system-ui, sans-serif",
    googleWeights: [400, 500, 600, 700],
  },
  "bricolage-grotesque": {
    family: "Bricolage Grotesque",
    cssVariable: "--font-bricolage-grotesque",
    fallback: "Inter, system-ui, sans-serif",
    googleWeights: [400, 500, 600, 700],
  },
  "instrument-serif": {
    family: "Instrument Serif",
    cssVariable: "--font-instrument-serif",
    fallback: 'Georgia, "Times New Roman", serif',
    googleWeights: [400],
  },
  fraunces: {
    family: "Fraunces",
    cssVariable: "--font-fraunces",
    fallback: 'Georgia, "Times New Roman", serif',
    googleWeights: [400, 500, 600, 700],
  },
  "playfair-display": {
    family: "Playfair Display",
    cssVariable: "--font-playfair-display",
    fallback: 'Georgia, "Times New Roman", serif',
    googleWeights: [400, 500, 600, 700, 800, 900],
  },
  "bodoni-moda": {
    family: "Bodoni Moda",
    cssVariable: "--font-bodoni-moda",
    fallback: 'Georgia, "Times New Roman", serif',
    googleWeights: [400, 500, 600, 700, 800, 900],
  },
  antonio: {
    family: "Antonio",
    cssVariable: "--font-antonio",
    fallback: '"Arial Narrow", Inter, sans-serif',
    googleWeights: [400, 500, 600, 700],
  },
  "barlow-condensed": {
    family: "Barlow Condensed",
    cssVariable: "--font-barlow-condensed",
    fallback: '"Arial Narrow", Inter, sans-serif',
    googleWeights: [400, 500, 600, 700, 800],
  },
  oswald: {
    family: "Oswald",
    cssVariable: "--font-oswald",
    fallback: '"Arial Narrow", Inter, sans-serif',
    googleWeights: [400, 500, 600, 700],
  },
  "archivo-black": {
    family: "Archivo Black",
    cssVariable: "--font-archivo-black",
    fallback: "Impact, Inter, sans-serif",
    googleWeights: [400],
  },
  "dela-gothic-one": {
    family: "Dela Gothic One",
    cssVariable: "--font-dela-gothic-one",
    fallback: "Impact, Inter, sans-serif",
    googleWeights: [400],
  },
} as const satisfies Record<string, FontDefinition>;

export interface FontDefinition {
  family: string;
  cssVariable: `--font-${string}`;
  fallback: string;
  /** Loaded from Google Fonts at these weights instead of through next/font. */
  googleWeights?: readonly number[];
}

export type FontId = keyof typeof FONTS;

/** Faces bundled through next/font on every page. */
export type BundledFontId = {
  [Id in FontId]: (typeof FONTS)[Id] extends { googleWeights: readonly number[] } ? never : Id;
}[FontId];

/** One Google Fonts stylesheet for the given study faces. */
export function googleFontsHref(ids: readonly FontId[]): string {
  const families = [...new Set(ids)].flatMap((id) => {
    const font: FontDefinition = FONTS[id];
    return font.googleWeights
      ? [`family=${font.family.replace(/ /g, "+")}:wght@${font.googleWeights.join(";")}`]
      : [];
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** The CSS font stack for a font id: the loaded face, then its fallbacks. */
export function fontStack(id: FontId): string {
  const font: FontDefinition = FONTS[id];
  return `var(${font.cssVariable}), ${font.fallback}`;
}
