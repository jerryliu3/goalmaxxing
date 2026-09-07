import { Fraunces, Outfit } from "next/font/google";
import { HarborConcept } from "@/features/ux-brand/atmosphere-organic";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-brand-display",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function HarborBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <HarborConcept />
    </div>
  );
}
