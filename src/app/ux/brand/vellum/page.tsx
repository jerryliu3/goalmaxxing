import { Newsreader, Source_Sans_3 } from "next/font/google";
import { VellumConcept } from "@/features/ux-brand/mixes-paper";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function VellumBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <VellumConcept />
    </div>
  );
}
