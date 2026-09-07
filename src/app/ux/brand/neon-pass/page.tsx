import { IBM_Plex_Mono, Rajdhani } from "next/font/google";
import { NeonPassConcept } from "@/features/ux-brand/atmosphere-night";

const display = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-brand-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-brand-mono",
});

export default function NeonPassBrandPage() {
  return (
    <div className={`${display.variable} ${mono.variable} ${display.className}`}>
      <NeonPassConcept />
    </div>
  );
}
