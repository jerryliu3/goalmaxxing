import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import { ColConcept } from "@/features/ux-brand/mixes-paper";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function ColBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable} ${mono.variable} font-[family-name:var(--font-brand-sans)]`}>
      <ColConcept />
    </div>
  );
}
