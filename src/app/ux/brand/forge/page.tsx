import { DM_Sans, Playfair_Display, Playfair_Display_SC } from "next/font/google";
import { ForgeConcept } from "@/features/ux-brand/forge-concept";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const displaySc = Playfair_Display_SC({
  subsets: ["latin"],
  weight: "900",
  variable: "--font-brand-display-sc",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function ForgeBrandPage() {
  return (
    <div className={`${display.variable} ${displaySc.variable} ${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <ForgeConcept />
    </div>
  );
}
