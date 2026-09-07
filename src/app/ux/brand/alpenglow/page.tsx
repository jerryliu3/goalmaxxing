import { Instrument_Sans, Newsreader } from "next/font/google";
import { AlpenglowConcept } from "@/features/ux-brand/mixes-ridge";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function AlpenglowBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <AlpenglowConcept />
    </div>
  );
}
