/** Metadata for platform font loaders. The catalog itself never performs network requests. */
export const BRAND_FONTS = {
  "geist": {
    "family": "Geist",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "geist-mono": {
    "family": "Geist Mono",
    "fallback": "monospace",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "newsreader": {
    "family": "Newsreader",
    "fallback": "serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": true
  },
  "source-sans-3": {
    "family": "Source Sans 3",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "ibm-plex-mono": {
    "family": "IBM Plex Mono",
    "fallback": "monospace",
    "source": "google",
    "weights": [
      400,
      500
    ],
    "italic": false
  },
  "fraunces": {
    "family": "Fraunces",
    "fallback": "serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": true
  },
  "manrope": {
    "family": "Manrope",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "bricolage-grotesque": {
    "family": "Bricolage Grotesque",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "instrument-sans": {
    "family": "Instrument Sans",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "bodoni-moda": {
    "family": "Bodoni Moda",
    "fallback": "serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "italic": true
  },
  "space-grotesk": {
    "family": "Space Grotesk",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "instrument-serif": {
    "family": "Instrument Serif",
    "fallback": "serif",
    "source": "google",
    "weights": [
      400
    ],
    "italic": true
  },
  "antonio": {
    "family": "Antonio",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "dm-sans": {
    "family": "DM Sans",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  },
  "dela-gothic-one": {
    "family": "Dela Gothic One",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400
    ],
    "italic": false
  },
  "playfair-display": {
    "family": "Playfair Display",
    "fallback": "serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "italic": true
  },
  "barlow-condensed": {
    "family": "Barlow Condensed",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "italic": false
  },
  "archivo-black": {
    "family": "Archivo Black",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400
    ],
    "italic": false
  },
  "oswald": {
    "family": "Oswald",
    "fallback": "sans-serif",
    "source": "google",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": false
  }
} as const;
export type BrandFontId = keyof typeof BRAND_FONTS;
export function brandFontStack(id: BrandFontId): string {
  const font = BRAND_FONTS[id];
  return `"${font.family}", ${font.fallback}`;
}
