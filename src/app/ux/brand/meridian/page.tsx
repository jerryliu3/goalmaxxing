import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { MeridianConcept } from "@/features/ux-brand/mixes-ridge";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function MeridianBrandPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} font-[family-name:var(--font-brand-sans)]`}>
      <MeridianConcept />
    </div>
  );
}
