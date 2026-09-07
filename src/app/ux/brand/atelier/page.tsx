import { Cormorant_Garamond, Karla } from "next/font/google";
import { AtelierConcept } from "@/features/ux-brand/atmosphere-organic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-brand-display",
});

const sans = Karla({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function AtelierBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <AtelierConcept />
    </div>
  );
}
