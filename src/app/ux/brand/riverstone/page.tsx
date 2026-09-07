import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import { RiverstoneConcept } from "@/features/ux-brand/atmosphere-organic";

const display = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-brand-display",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function RiverstoneBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <RiverstoneConcept />
    </div>
  );
}
