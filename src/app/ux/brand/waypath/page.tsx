import { Outfit, Syne } from "next/font/google";
import { WaypathConcept } from "@/features/ux-brand/waypath-concept";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function WaypathBrandPage() {
  return (
    <div className={`${display.variable} ${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <WaypathConcept />
    </div>
  );
}
