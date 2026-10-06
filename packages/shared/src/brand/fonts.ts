/**
 * Every typeface a theme may use. Platforms load these by id: web through
 * `next/font` (src/lib/brand/fonts.ts, whose `variable` must equal `cssVariable`),
 * native through expo-google-fonts.
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
} as const satisfies Record<string, FontDefinition>;

export interface FontDefinition {
  family: string;
  cssVariable: `--font-${string}`;
  fallback: string;
}

export type FontId = keyof typeof FONTS;

/** The CSS font stack for a font id: the loaded face, then its fallbacks. */
export function fontStack(id: FontId): string {
  const font: FontDefinition = FONTS[id];
  return `var(${font.cssVariable}), ${font.fallback}`;
}
