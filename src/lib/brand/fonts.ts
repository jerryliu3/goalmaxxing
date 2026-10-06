import { Geist, Geist_Mono, IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import type { FontId } from "@cadence/shared/brand";

/*
 * next/font needs literal options, so each `variable` repeats the registry's
 * `cssVariable` for that font (packages/shared/src/brand/fonts.ts); a test
 * keeps the two in step.
 */
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const FONT_LOADERS: Record<FontId, { variable: string }> = {
  geist,
  "geist-mono": geistMono,
  newsreader,
  "source-sans-3": sourceSans,
  "ibm-plex-mono": plexMono,
};

/** Classes that define every theme font's CSS variable; put them on <html>. */
export const FONT_VARIABLE_CLASSES = Object.values(FONT_LOADERS)
  .map((font) => font.variable)
  .join(" ");
