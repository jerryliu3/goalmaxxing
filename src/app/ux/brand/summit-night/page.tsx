import { IBM_Plex_Mono, Sora } from "next/font/google";
import { SummitNightConcept } from "@/features/ux-brand/atmosphere-night";

const sans = Sora({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-brand-mono",
});

export default function SummitNightBrandPage() {
  return (
    <div className={`${sans.variable} ${mono.variable}`}>
      <SummitNightConcept />
    </div>
  );
}
