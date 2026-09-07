import { IBM_Plex_Mono, Inter, Newsreader, Source_Sans_3 } from "next/font/google";
import { HueContrastStudy } from "@/features/ux-brand/hue-contrast";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

const live = Inter({
  subsets: ["latin"],
  variable: "--font-live-sans",
});

export default function HueContrastBrandPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} ${mono.variable} ${live.variable}`}
    >
      <HueContrastStudy />
    </div>
  );
}
