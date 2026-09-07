import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { SwitchbackConcept } from "@/features/ux-brand/mixes-ridge";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function SwitchbackBrandPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} font-[family-name:var(--font-brand-sans)]`}>
      <SwitchbackConcept />
    </div>
  );
}
