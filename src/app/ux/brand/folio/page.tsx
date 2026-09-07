import { Newsreader, Source_Sans_3 } from "next/font/google";
import { FolioConcept } from "@/features/ux-brand/folio-concept";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function FolioBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <FolioConcept />
    </div>
  );
}
