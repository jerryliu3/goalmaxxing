import { Barlow, Barlow_Condensed } from "next/font/google";
import { AeroConcept } from "@/features/ux-brand/atmosphere-modern";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-brand-display",
});

const sans = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-sans",
});

export default function AeroBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <AeroConcept />
    </div>
  );
}
