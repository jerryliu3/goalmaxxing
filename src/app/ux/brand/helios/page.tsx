import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { HeliosConcept } from "@/features/ux-brand/atmosphere-organic";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brand-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function HeliosBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <HeliosConcept />
    </div>
  );
}
