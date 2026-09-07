import { Instrument_Sans } from "next/font/google";
import { DawnConcept } from "@/features/ux-brand/dawn-concept";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function DawnBrandPage() {
  return (
    <div className={`${sans.variable} font-[family-name:var(--font-brand-sans)]`}>
      <DawnConcept />
    </div>
  );
}
